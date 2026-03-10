import { generateEmbedding } from '../ai/ollamaService';
import { searchByVector } from '../ai/qdrantService';
import { SearchResult } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Natural Language Search Service
//
// Pipeline:
//  1. User sends a query string
//  2. Generate embedding for the query text
//  3. Find nearest vectors in Qdrant
//  4. Return matching media items with similarity scores
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchOptions {
  query:     string;
  limit?:    number;
  minScore?: number;
  type?:     'image' | 'video' | 'all';
}

export async function naturalLanguageSearch(opts: SearchOptions): Promise<SearchResult[]> {
  const { query, limit = 20, minScore = 0.25, type = 'all' } = opts;

  if (!query.trim()) return [];

  console.log(`[Search] Query: "${query}"`);

  // ① Generate query embedding
  const queryVector = await generateEmbedding(query);

  // ② Search Qdrant
  let results = await searchByVector(queryVector, limit * 2, minScore);

  // ③ Post-filter by media type if requested
  if (type !== 'all') {
    results = results.filter(r => r.mediaItem.type === type);
  }

  // Trim to requested limit
  results = results.slice(0, limit);

  console.log(`[Search] Found ${results.length} results for "${query}"`);
  return results;
}
