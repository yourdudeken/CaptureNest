import { FastifyPluginAsync } from 'fastify';
import {
  listMedia,
  getMediaById,
  deleteMedia,
} from '../../services/media/mediaService';
import { reanalyzeMedia } from '../../services/ai/analysisPipeline';
import { deleteEmbedding } from '../../services/ai/qdrantService';
import { MediaType } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Media Routes
// GET  /api/media             – paginated media list with filters
// GET  /api/media/:id         – single media item
// DELETE /api/media/:id       – delete media + files + vector
// POST /api/media/:id/reanalyze – re-run AI pipeline
// ─────────────────────────────────────────────────────────────────────────────

const mediaRoutes: FastifyPluginAsync = async (fastify) => {

  /** GET /api/media */
  fastify.get('/', async (req, reply) => {
    const qs = req.query as Record<string, string>;

    const { items, total } = listMedia({
      type:        (qs.type as MediaType) || undefined,
      cameraId:    qs.cameraId || undefined,
      limit:       Math.min(parseInt(qs.limit  || '50', 10), 200),
      offset:      parseInt(qs.offset || '0', 10),
      aiProcessed: qs.aiProcessed === undefined ? undefined : qs.aiProcessed === '1',
    });

    return reply.send({ items, total, limit: parseInt(qs.limit || '50', 10), offset: parseInt(qs.offset || '0', 10) });
  });

  /** GET /api/media/:id */
  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const item = getMediaById(id);

    if (!item) return reply.code(404).send({ error: 'Media not found' });
    return reply.send(item);
  });

  /** DELETE /api/media/:id */
  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const item = getMediaById(id);

    if (!item) return reply.code(404).send({ error: 'Media not found' });

    // Delete from vector store first (non-fatal if it fails)
    await deleteEmbedding(id).catch(err =>
      fastify.log.warn(`[Qdrant] Could not delete embedding for ${id}: ${err.message}`)
    );

    const deleted = await deleteMedia(id);
    if (!deleted) return reply.code(500).send({ error: 'Failed to delete media' });

    return reply.send({ success: true, id });
  });

  /** POST /api/media/:id/reanalyze */
  fastify.post('/:id/reanalyze', async (req, reply) => {
    const { id } = req.params as { id: string };
    const item = getMediaById(id);

    if (!item) return reply.code(404).send({ error: 'Media not found' });
    if (item.type !== 'image') return reply.code(400).send({ error: 'Only images can be reanalyzed' });

    // Non-blocking
    setImmediate(() => reanalyzeMedia(id));

    return reply.send({ success: true, message: 'Re-analysis queued' });
  });

  /** GET /api/media/stats – aggregate counts */
  fastify.get('/stats/overview', async (_req, reply) => {
    const all    = listMedia({ limit: 9999 });
    const images = listMedia({ type: 'image', limit: 9999 });
    const videos = listMedia({ type: 'video', limit: 9999 });
    const analyzed = listMedia({ aiProcessed: true, limit: 9999 });

    return reply.send({
      total:     all.total,
      images:    images.total,
      videos:    videos.total,
      analyzed:  analyzed.total,
      unanalyzed: all.total - analyzed.total,
    });
  });
};

export default mediaRoutes;
