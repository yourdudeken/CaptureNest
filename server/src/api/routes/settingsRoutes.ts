import { FastifyPluginAsync } from 'fastify';
import { getAllSettings, updateSettings } from '../../services/settings/settingsService';
import { checkOllamaHealth, listOllamaModels } from '../../services/ai/ollamaService';
import { checkQdrantHealth } from '../../services/ai/qdrantService';

// ─────────────────────────────────────────────────────────────────────────────
// Settings Routes
// GET  /api/settings          – get all settings
// PUT  /api/settings          – update settings
// GET  /api/settings/health   – health-check all services
// GET  /api/settings/models   – list available Ollama models
// ─────────────────────────────────────────────────────────────────────────────

const settingsRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.get('/', async (_req, reply) => {
    return reply.send(getAllSettings());
  });

  fastify.put('/', async (req, reply) => {
    const body = req.body as Record<string, string>;
    if (!body || typeof body !== 'object') {
      return reply.code(400).send({ error: 'Body must be a key-value object' });
    }
    updateSettings(body);
    return reply.send({ success: true, settings: getAllSettings() });
  });

  fastify.get('/health', async (_req, reply) => {
    const [ollama, qdrant] = await Promise.all([
      checkOllamaHealth(),
      checkQdrantHealth(),
    ]);

    return reply.send({
      api:    'ok',
      ollama: ollama ? 'ok' : 'unavailable',
      qdrant: qdrant ? 'ok' : 'unavailable',
    });
  });

  fastify.get('/models', async (_req, reply) => {
    const models = await listOllamaModels();
    return reply.send({ models });
  });
};

export default settingsRoutes;
