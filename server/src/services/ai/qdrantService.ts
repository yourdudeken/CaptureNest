import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantPayload, SearchResult } from '../../types';
import { getSettings } from '../settings/settingsService';
import { getEntryById } from '../media/entryService';

const VECTOR_SIZE = parseInt(process.env.EMBED_DIMENSIONS || '768', 10);
let client: QdrantClient;
let collectionName: string;

export async function initQdrant(): Promise<void> {
  const settings = getSettings();
  collectionName = settings.qdrantCollection;

  client = new QdrantClient({ url: settings.qdrantUrl });

  try {
    await ensureCollection();
    console.log(`[Qdrant] Connected to ${settings.qdrantUrl}, collection: ${collectionName}`);
  } catch (err) {
    console.warn('[Qdrant] Could not initialise:', (err as Error).message);
  }
}

async function ensureCollection(): Promise<void> {
  const collections = await client.getCollections();
  const exists = collections.collections.some(c => c.name === collectionName);

  if (!exists) {
    await client.createCollection(collectionName, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
      optimizers_config: {
        indexing_threshold: 20_000,
      },
    });
    console.log(`[Qdrant] Created collection "${collectionName}"`);
  }
}

export async function upsertEmbedding(
  entryId: string,
  vector: number[],
  payload: QdrantPayload
): Promise<void> {
  const numericId = uuidToNumericId(entryId);

  await client.upsert(collectionName, {
    wait: true,
    points: [{ id: numericId, vector, payload }],
  });
}

export async function searchByVector(
  queryVector: number[],
  limit = 20,
  minScore = 0.3
): Promise<SearchResult[]> {
  const results = await client.search(collectionName, {
    vector: queryVector,
    limit,
    with_payload: true,
    score_threshold: minScore,
  });

  const searchResults: SearchResult[] = [];

  for (const hit of results) {
    const payload = hit.payload as QdrantPayload;
    if (!payload?.entryId) continue;

    const entry = getEntryById(payload.entryId);
    if (!entry) continue;

    searchResults.push({ entry, score: hit.score });
  }

  return searchResults;
}

export async function deleteEmbedding(entryId: string): Promise<void> {
  const numericId = uuidToNumericId(entryId);
  await client.delete(collectionName, {
    wait: true,
    points: [numericId],
  });
}

export async function checkQdrantHealth(): Promise<boolean> {
  try {
    await client.getCollections();
    return true;
  } catch {
    return false;
  }
}

function uuidToNumericId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (Math.imul(31, hash) + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}