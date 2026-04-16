import { FastifyPluginAsync } from 'fastify';
import { generateEmbedding } from '../ai/ollamaService';
import { searchByVector } from '../ai/qdrantService';
import { SearchResult } from '../../types';

export interface SearchOptions {
  query:     string;
  limit?:    number;
  minScore?: number;
  type?:     'text' | 'audio' | 'image' | 'video' | 'document' | 'all';
}

export async function naturalLanguageSearch(opts: SearchOptions): Promise<SearchResult[]> {
  const { query, limit = 20, minScore = 0.25, type = 'all' } = opts;

  if (!query.trim()) return [];

  console.log(`[Search] Query: "${query}"`);

  const queryVector = await generateEmbedding(query);

  let results = await searchByVector(queryVector, limit * 2, minScore);

  if (type !== 'all') {
    results = results.filter(r => r.entry.type === type);
  }

  results = results.slice(0, limit);

  console.log(`[Search] Found ${results.length} results for "${query}"`);
  return results;
}