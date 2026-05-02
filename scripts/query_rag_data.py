#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

import chromadb


def main() -> int:
    parser = argparse.ArgumentParser(description="Query local Chroma RAG store")
    parser.add_argument("question", help="Query text")
    parser.add_argument("--top-k", type=int, default=5, help="Top-K results")
    parser.add_argument(
        "--store-path",
        default=str(Path(__file__).resolve().parents[1] / "chromadb_store"),
        help="Path to chroma store",
    )
    parser.add_argument(
        "--collection", default="rag_guide_knowledge", help="Collection name"
    )
    args = parser.parse_args()

    client = chromadb.PersistentClient(path=args.store_path)
    collection = client.get_collection(args.collection)
    result = collection.query(
        query_texts=[args.question],
        n_results=args.top_k,
        include=["documents", "metadatas", "distances"],
    )

    print(f"QUERY: {args.question}")
    ids = result.get("ids", [[]])[0]
    print(f"RESULT_COUNT: {len(ids)}")

    for index, (doc, meta, dist) in enumerate(
        zip(
            result.get("documents", [[]])[0],
            result.get("metadatas", [[]])[0],
            result.get("distances", [[]])[0],
        ),
        1,
    ):
        print(
            f"--- TOP{index} dist={dist:.4f} "
            f"source={meta.get('source_label', '')} "
            f"dataset={meta.get('dataset', '')} row={meta.get('row_index', '')}"
        )
        print(doc[:700].replace("\n", " "))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

