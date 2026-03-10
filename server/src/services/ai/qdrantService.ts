import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantPayload, SearchResult } from '../../types';
import { getSettings } from '../settings/settingsService';
import { getMediaById } from '../media/mediaService';

// ─────────────────────────────────────────────────────────────────────────────
// Qdrant Vector Database Service
//
// Stores embeddings for each AI-analyzed media item and enables semantic
// (natural language) search across the media library.
//
// Collection schema:
//   vector: float[]  (768 dims for nomic-embed-text; 4096 for LLaVA)
//   payload: QdrantPayload
// ─────────────────────────────────────────────────────────────────────────────

const VECTOR_SIZE = parseInt(process.env.EMBED_DIMENSIONS || '768', 10);
let client: QdrantClient;
let collectionName: string;

/** Initialise the Qdrant client and ensure the collection exists */
export async function initQdrant(): Promise<void> {
  const settings = getSettings();
  collectionName = settings.qdrantCollection;

  client = new QdrantClient({ url: settings.qdrantUrl });

  try {
    await ensureCollection();
    console.log(`[Qdrant] Connected to ${settings.qdrantUrl}, collection: ${collectionName}`);
  } catch (err) {
    // Qdrant may not be available immediately on startup; log and continue
    console.warn('[Qdrant] Could not initialise:', (err as Error).message);
  }
}

async function ensureCollection(): Promise<void> {
  const collections = await client.getCollections();
  const exists = collections.collections.some(c => c.name === collectionName);

  if (!exists) {
    await client.createCollection(collectionName, {
      vectors: {
        size:     VECTOR_SIZE,
        distance: 'Cosine',       // cosine similarity best for text embeddings
      },
      optimizers_config: {
        indexing_threshold: 20_000,
      },
    });
    console.log(`[Qdrant] Created collection "${collectionName}"`);
  }
}

/**
 * Upsert a media embedding.
 * If a point with the same mediaId exists, it is overwritten.
 */
export async function upsertEmbedding(
  mediaId: string,
  vector: number[],
  payload: QdrantPayload
): Promise<void> {
  // Use a numeric hash of the UUID as the Qdrant point ID
  const numericId = uuidToNumericId(mediaId);

  await client.upsert(collectionName, {
    wait: true,
    points: [{ id: numericId, vector, payload }],
  });
}

/**
 * Search for the most similar media items to a query vector.
 * Returns up to `limit` results above a minimum score threshold.
 */
export async function searchByVector(
  queryVector: number[],
  limit = 20,
  minScore = 0.3
): Promise<SearchResult[]> {
  const results = await client.search(collectionName, {
    vector:         queryVector,
    limit,
    with_payload:   true,
    score_threshold: minScore,
  });

  const searchResults: SearchResult[] = [];

  for (const hit of results) {
    const payload = hit.payload as QdrantPayload;
    if (!payload?.mediaId) continue;

    const mediaItem = getMediaById(payload.mediaId);
    if (!mediaItem) continue;

    searchResults.push({ mediaItem, score: hit.score });
  }

  return searchResults;
}

/** Delete a point from the vector store when the media is deleted */
export async function deleteEmbedding(mediaId: string): Promise<void> {
  const numericId = uuidToNumericId(mediaId);
  await client.delete(collectionName, {
    wait:   true,
    points: [numericId],
  });
}

/** Health-check */
export async function checkQdrantHealth(): Promise<boolean> {
  try {
    await client.getCollections();
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UUID → deterministic integer
// Qdrant point IDs must be unsigned 64-bit integers.
// We derive one by hashing the UUID string.
// ─────────────────────────────────────────────────────────────────────────────
function uuidToNumericId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (Math.imul(31, hash) + uuid.charCodeAt(i)) | 0;
  }
  // Ensure positive
  return Math.abs(hash);
}
