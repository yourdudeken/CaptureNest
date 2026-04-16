import { FastifyPluginAsync } from 'fastify';
import { naturalLanguageSearch } from '../../services/search/searchService';
import { EntryType } from '../../types';

const searchRoutes: FastifyPluginAsync = async (fastify) => {

  /**
   * POST /api/search
   * Body: { query: string, limit?: number, minScore?: number, type?: EntryType|'all' }
   */
  fastify.post('/', async (req, reply) => {
    const body = req.body as {
      query?:    string;
      limit?:    number;
      minScore?: number;
      type?:     EntryType | 'all';
    };

    if (!body?.query?.trim()) {
      return reply.code(400).send({ error: 'query is required' });
    }

    try {
      const results = await naturalLanguageSearch({
        query:    body.query,
        limit:    body.limit    ?? 20,
        minScore: body.minScore ?? 0.25,
        type:     body.type     ?? 'all',
      });

      return reply.send({
        query:   body.query,
        count:   results.length,
        results: results.map(r => ({
          ...r.entry,
          score: r.score,
        })),
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Search failed' });
    }
  });
};

export default searchRoutes;