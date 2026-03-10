import { FastifyPluginAsync } from 'fastify';
import {
  listCameras,
  getCameraById,
  addCamera,
  updateCamera,
  deleteCamera,
} from '../../services/camera/cameraService';
import { CameraConfig } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Camera Routes
// GET    /api/camera         – list cameras
// GET    /api/camera/:id     – get camera
// POST   /api/camera         – add camera
// PUT    /api/camera/:id     – update camera
// DELETE /api/camera/:id     – delete camera
// ─────────────────────────────────────────────────────────────────────────────

const cameraRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.get('/', async (_req, reply) => {
    return reply.send({ cameras: listCameras() });
  });

  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const cam = getCameraById(id);
    if (!cam) return reply.code(404).send({ error: 'Camera not found' });
    return reply.send(cam);
  });

  fastify.post('/', async (req, reply) => {
    const body = req.body as Omit<CameraConfig, 'id'>;
    if (!body?.name || !body?.type || body?.source === undefined) {
      return reply.code(400).send({ error: 'name, type, and source are required' });
    }
    const cam = addCamera({
      name:             body.name,
      type:             body.type,
      source:           body.source,
      enabled:          body.enabled          ?? true,
      motionDetection:  body.motionDetection  ?? false,
      scheduledCapture: body.scheduledCapture ?? false,
      scheduleInterval: body.scheduleInterval ?? 60,
    });
    return reply.code(201).send(cam);
  });

  fastify.put('/:id', async (req, reply) => {
    const { id }  = req.params as { id: string };
    const updates = req.body as Partial<Omit<CameraConfig, 'id'>>;
    const cam     = updateCamera(id, updates);
    if (!cam) return reply.code(404).send({ error: 'Camera not found' });
    return reply.send(cam);
  });

  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const deleted = deleteCamera(id);
    if (!deleted) return reply.code(404).send({ error: 'Camera not found' });
    return reply.send({ success: true, id });
  });
};

export default cameraRoutes;
