#!/usr/bin/env python3
"""
Ingest structured XLSX data into local ChromaDB for RAG.

Expected input files under project_root/data:
- lingshan_data.xlsx
- nianhuawan_data.xlsx

Usage:
  python scripts/ingest_rag_data.py
  python scripts/ingest_rag_data.py --embedding-provider ark
  python scripts/ingest_rag_data.py --collection rag_guide_knowledge --reset
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import pandas as pd
import requests
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
else:
    Documents = list[str]  # type: ignore[assignment]
    Embeddings = list[list[float]]  # type: ignore[assignment]
    EmbeddingFunction = object  # type: ignore[assignment]


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
PACKAGES_DATA_DIR = PROJECT_ROOT / "packages" / "data"
CHROMA_DIR = PROJECT_ROOT / "chromadb_store"


@dataclass
class DatasetSpec:
    name: str
    file_path: Path
    source_label: str


class ArkEmbeddingFunction:
    """OpenAI-compatible embeddings adapter for Ark/Doubao."""

    def __init__(
        self,
        api_key: str,
        model: str,
        base_url: str = "https://ark.cn-beijing.volces.com/api/v3",
        timeout: int = 30,
        batch_size: int = 64,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.batch_size = batch_size

    def __call__(self, input: Documents) -> Embeddings:
        all_vectors: Embeddings = []
        for start in range(0, len(input), self.batch_size):
            batch = input[start : start + self.batch_size]
            payload = {"model": self.model, "input": batch}
            response = requests.post(
                f"{self.base_url}/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=self.timeout,
            )
            if not response.ok:
                raise RuntimeError(
                    f"Ark embedding request failed ({response.status_code}): "
                    f"{response.text[:400]}"
                )
            body = response.json()
            data = body.get("data", [])
            # OpenAI-compatible API returns vectors sorted by index
            sorted_items = sorted(data, key=lambda x: x.get("index", 0))
            all_vectors.extend([item["embedding"] for item in sorted_items])
        return all_vectors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest XLSX data into ChromaDB.")
    parser.add_argument(
        "--collection",
        default="rag_guide_knowledge",
        help="Target Chroma collection name.",
    )
    parser.add_argument(
        "--embedding-provider",
        choices=["default", "ark"],
        default=os.getenv("RAG_EMBEDDING_PROVIDER", "default"),
        help="Embedding backend (default local or Ark).",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete and recreate the target collection before ingest.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=64,
        help="Upsert batch size.",
    )
    return parser.parse_args()


def normalize_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    text = str(value).strip()
    return "" if text.lower() in {"nan", "none", "null"} else text


def row_to_dict(row: pd.Series) -> dict[str, str]:
    return {str(col).strip(): normalize_value(row[col]) for col in row.index}


def pick_fields(record: dict[str, str], keywords: Iterable[str]) -> list[str]:
    results: list[str] = []
    for key, value in record.items():
        lowered = key.lower()
        if value and any(keyword in lowered or keyword in key for keyword in keywords):
            results.append(f"{key}：{value}")
    return results


def build_document_text(dataset_name: str, record: dict[str, str]) -> str:
    # Common semantic blocks; supports mixed Chinese/English headers.
    name_fields = pick_fields(record, ["名称", "name", "标题", "景点"])
    location_fields = pick_fields(record, ["位置", "地址", "location", "区", "坐标"])
    intro_fields = pick_fields(record, ["介绍", "简介", "详情", "description", "story"])
    highlight_fields = pick_fields(record, ["亮点", "特色", "推荐", "看点", "highlight"])
    open_fields = pick_fields(
        record, ["开放", "营业", "时间", "门票", "price", "hour", "预约", "交通"]
    )

    # Fallback: include all non-empty fields so no data is lost.
    all_fields = [f"{k}：{v}" for k, v in record.items() if v]
    if not any([name_fields, location_fields, intro_fields, highlight_fields, open_fields]):
        core = "；".join(all_fields)
        return (
            f"这是来自{dataset_name}结构化资料的一条导览数据。"
            f"以下为该条目的原始信息：{core}。"
        )

    parts: list[str] = [f"数据来源：{dataset_name}。"]
    if name_fields:
        parts.append("景点/条目识别信息：" + "；".join(name_fields) + "。")
    if location_fields:
        parts.append("具体位置与到达相关信息：" + "；".join(location_fields) + "。")
    if intro_fields:
        parts.append("详细介绍：" + "；".join(intro_fields) + "。")
    if highlight_fields:
        parts.append("游玩亮点与推荐体验：" + "；".join(highlight_fields) + "。")
    if open_fields:
        parts.append("开放与游览须知：" + "；".join(open_fields) + "。")

    # Add full structured payload tail to improve retrieval recall.
    parts.append(
        "结构化字段快照：" + "；".join(all_fields[:30]) + ("；..." if len(all_fields) > 30 else "") + "。"
    )
    return " ".join(parts)


def stable_id(dataset_name: str, record: dict[str, str], row_idx: int) -> str:
    raw = json.dumps({"dataset": dataset_name, "row": row_idx, "record": record}, ensure_ascii=False)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]
    return f"{dataset_name}_{row_idx}_{digest}"


def first_existing_path(candidates: list[Path]) -> Path:
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def resolve_dataset_files() -> list[DatasetSpec]:
    specs = [
        DatasetSpec(
            name="lingshan_data",
            file_path=first_existing_path(
                [
                    DATA_DIR / "lingshan_data.xlsx",
                    PACKAGES_DATA_DIR / "lingshan_data.xlsx",
                ]
            ),
            source_label="灵山胜境",
        ),
        DatasetSpec(
            name="nianhuawan_data",
            file_path=first_existing_path(
                [
                    DATA_DIR / "nianhuawan_data.xlsx",
                    PACKAGES_DATA_DIR / "nianhuawan_data.xlsx",
                ]
            ),
            source_label="拈花湾禅意小镇",
        ),
    ]
    return specs


def load_dataset(spec: DatasetSpec) -> pd.DataFrame:
    if not spec.file_path.exists():
        raise FileNotFoundError(f"Missing input file: {spec.file_path}")
    df = pd.read_excel(spec.file_path)
    if df.empty:
        raise ValueError(f"Excel has no rows: {spec.file_path}")
    return df


def get_embedding_function(provider: str):
    if provider == "ark":
        api_key = os.getenv("ARK_API_KEY") or os.getenv("VOLCENGINE_ARK_API_KEY")
        model = os.getenv("ARK_EMBEDDING_MODEL") or os.getenv("ARK_MODEL")
        base_url = os.getenv("ARK_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
        if not api_key or not model:
            raise RuntimeError(
                "ARK embedding provider selected, but ARK_API_KEY/ARK_EMBEDDING_MODEL is missing."
            )
        print(f"[Embedding] Provider=ark, model={model}, base_url={base_url}")
        return ArkEmbeddingFunction(api_key=api_key, model=model, base_url=base_url)

    print("[Embedding] Provider=default (Chroma built-in lightweight embedding)")
    from chromadb.utils import embedding_functions

    return embedding_functions.DefaultEmbeddingFunction()


def chunked(seq: list[Any], size: int) -> Iterable[list[Any]]:
    for start in range(0, len(seq), size):
        yield seq[start : start + size]


def main() -> int:
    args = parse_args()
    try:
        import chromadb
        from chromadb.utils import embedding_functions
    except ModuleNotFoundError:
        print("[Error] Missing dependency: chromadb")
        print("Install with: pip install chromadb")
        return 1

    print("=== RAG Data Ingestion Started ===")
    print(f"[Config] Project root: {PROJECT_ROOT}")
    print(f"[Config] Data dir: {DATA_DIR}")
    print(f"[Config] Chroma dir: {CHROMA_DIR}")
    print(f"[Config] Collection: {args.collection}")
    print(f"[Config] Embedding provider: {args.embedding_provider}")
    print(f"[Config] Reset collection: {args.reset}")
    print("")

    dataset_specs = resolve_dataset_files()
    missing = [spec.file_path for spec in dataset_specs if not spec.file_path.exists()]
    if missing:
        print("[Error] Missing required XLSX files:")
        for p in missing:
            print(f"  - {p}")
        print(
            "Please place lingshan_data.xlsx and nianhuawan_data.xlsx under data/ and rerun."
        )
        return 1

    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    embedding_function = get_embedding_function(args.embedding_provider)

    if args.reset:
        try:
            client.delete_collection(args.collection)
            print(f"[Chroma] Existing collection '{args.collection}' deleted.")
        except Exception:
            pass

    collection = client.get_or_create_collection(
        name=args.collection,
        embedding_function=embedding_function,
        metadata={"hnsw:space": "cosine"},
    )

    total_rows = 0
    total_added = 0
    per_dataset_stats: dict[str, dict[str, int]] = {}

    for spec in dataset_specs:
        print(f"\n[Dataset] Loading {spec.name} from {spec.file_path.name} ...")
        df = load_dataset(spec)
        rows = len(df)
        print(f"[Dataset] Rows loaded: {rows}")
        total_rows += rows

        ids: list[str] = []
        docs: list[str] = []
        metas: list[dict[str, Any]] = []

        for idx, row in df.iterrows():
            record = row_to_dict(row)
            document = build_document_text(spec.source_label, record)
            doc_id = stable_id(spec.name, record, int(idx))
            ids.append(doc_id)
            docs.append(document)
            metas.append(
                {
                    "dataset": spec.name,
                    "source_label": spec.source_label,
                    "row_index": int(idx),
                    "file_name": spec.file_path.name,
                    "title": next(iter([v for k, v in record.items() if "名称" in k or "name" in k.lower() and v]), ""),
                }
            )
            if (idx + 1) % 100 == 0 or (idx + 1) == rows:
                print(f"[Dataset:{spec.name}] Prepared {idx + 1}/{rows} documents")

        for batch_ids, batch_docs, batch_metas in zip(
            chunked(ids, args.batch_size),
            chunked(docs, args.batch_size),
            chunked(metas, args.batch_size),
        ):
            collection.upsert(ids=batch_ids, documents=batch_docs, metadatas=batch_metas)
            total_added += len(batch_ids)
            print(
                f"[Chroma] Upserted batch: +{len(batch_ids)} "
                f"(running total: {total_added})"
            )

        per_dataset_stats[spec.name] = {"rows": rows, "ingested": len(ids)}

    final_count = collection.count()
    print("\n=== Ingestion Completed ===")
    print(f"[Summary] Total rows read: {total_rows}")
    print(f"[Summary] Total documents upserted this run: {total_added}")
    print(f"[Summary] Collection current count: {final_count}")
    print(f"[Summary] Storage path: {CHROMA_DIR}")
    print("[Summary] Per dataset:")
    for name, stat in per_dataset_stats.items():
        print(f"  - {name}: rows={stat['rows']}, ingested={stat['ingested']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

