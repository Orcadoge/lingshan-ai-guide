import { ChromaClient } from 'chromadb';

type RagHit = {
  id: string;
  distance?: number;
  document: string;
  metadata: Record<string, unknown>;
};

type RagRetrievalResult = {
  hits: RagHit[];
  contextText: string;
};

let chromaClient: ChromaClient | null = null;

function getChromaClient() {
  if (chromaClient) {
    return chromaClient;
  }

  const path = process.env.CHROMA_URL ?? 'http://127.0.0.1:8000';
  chromaClient = new ChromaClient({ path });
  return chromaClient;
}

function normalizeQuestion(raw: string) {
  return raw.trim().slice(0, 300);
}

function buildContextText(hits: RagHit[]) {
  if (!hits.length) {
    return '';
  }

  return hits
    .map((hit, index) => {
      const source = String(hit.metadata.source_label ?? hit.metadata.dataset ?? '未知来源');
      const row = hit.metadata.row_index ?? '-';
      return [
        `【命中${index + 1}】`,
        `【来源】${source}`,
        `【行号】${row}`,
        `【内容】${hit.document.replace(/\s+/g, ' ').slice(0, 1200)}`,
      ].join('\n');
    })
    .join('\n\n');
}

export async function queryRagContext(
  question: string,
  nResults = 3,
): Promise<RagRetrievalResult> {
  const normalized = normalizeQuestion(question);

  if (!normalized) {
    return { hits: [], contextText: '' };
  }

  try {
    const client = getChromaClient();
    const collectionName = process.env.CHROMA_COLLECTION ?? 'rag_guide_knowledge';
    const collection = await client.getCollection({ name: collectionName });
    const queryResult = await collection.query({
      queryTexts: [normalized],
      nResults,
      include: ['documents', 'metadatas', 'distances'],
    });

    const ids = queryResult.ids?.[0] ?? [];
    const docs = queryResult.documents?.[0] ?? [];
    const metas = queryResult.metadatas?.[0] ?? [];
    const distances = queryResult.distances?.[0] ?? [];

    const hits: RagHit[] = ids
      .map((id, index) => ({
        id,
        distance:
          typeof distances[index] === 'number' ? distances[index] : undefined,
        document: docs[index] ?? '',
        metadata: (metas[index] as Record<string, unknown> | undefined) ?? {},
      }))
      .filter((item) => item.document);

    // Required by request: always print hit count.
    // eslint-disable-next-line no-console
    console.log(`[RAG] 命中数据条数: ${hits.length}`);

    return {
      hits,
      contextText: buildContextText(hits),
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[RAG] 查询失败，已降级为空上下文: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    // Required by request: still print hit count on failure path.
    // eslint-disable-next-line no-console
    console.log('[RAG] 命中数据条数: 0');
    return { hits: [], contextText: '' };
  }
}

