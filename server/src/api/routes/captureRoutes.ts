import { FastifyPluginAsync } from 'fastify';
import { saveImage } from '../../services/media/mediaService';
import { startRecording, stopRecording, isRecording } from '../../services/media/ffmpegService';
import { saveVideo } from '../../services/media/mediaService';
import { runAnalysisPipeline } from '../../services/ai/analysisPipeline';
import { getSettings } from '../../services/settings/settingsService';
import { getCameraById } from '../../services/camera/cameraService';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { VIDEOS_DIR } from '../../services/media/mediaService';

// ─────────────────────────────────────────────────────────────────────────────
// Capture Routes
// POST /api/capture/image  – capture a still image (receives raw image bytes)
// POST /api/capture/video/start  – start video recording
// POST /api/capture/video/stop   – stop video recording
// GET  /api/capture/status       – current capture status
// ─────────────────────────────────────────────────────────────────────────────

const captureRoutes: FastifyPluginAsync = async (fastify) => {

  /**
   * POST /api/capture/image
   * Body: multipart form with field "image" (file) OR "imageData" (base64 JSON)
   * Query: ?cameraId=default
   */
  fastify.post('/image', async (req, reply) => {
    const cameraId = (req.query as Record<string, string>).cameraId || 'default';

    try {
      let imageBuffer: Buffer;

      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('multipart')) {
        // ── File upload ─────────────────────────────────────────
        const data = await req.file();
        if (!data) return reply.code(400).send({ error: 'No image file provided' });
        imageBuffer = await data.toBuffer();
      } else {
        // ── JSON with base64 ────────────────────────────────────
        const body = req.body as { imageData?: string };
        if (!body?.imageData) return reply.code(400).send({ error: 'No image data' });
        const b64 = body.imageData.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(b64, 'base64');
      }

      const media = await saveImage(imageBuffer, cameraId);

      // Kick off AI analysis asynchronously (non-blocking)
      const settings = getSettings();
      if (settings.aiAutoAnalyze) {
        setImmediate(() => runAnalysisPipeline(media.id));
      }

      return reply.code(201).send({ success: true, media });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to capture image' });
    }
  });

  /**
   * POST /api/capture/video/upload
   * Body: multipart form with field "media" (file)
   * Query: ?cameraId=default
   */
  fastify.post('/video/upload', async (req, reply) => {
    const cameraId = (req.query as Record<string, string>).cameraId || 'default';
    try {
      const data = await req.file();
      if (!data) return reply.code(400).send({ error: 'No video file provided' });
      
      const buffer = await data.toBuffer();
      const filename = `${Date.now()}-${uuidv4()}.webm`;
      const filepath = path.join(VIDEOS_DIR, filename);
      
      await fs.writeFile(filepath, buffer);
      
      const media = await saveVideo(filepath, cameraId);
      return reply.code(201).send({ success: true, media });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to upload video' });
    }
  });

  /**
   * POST /api/capture/video/start
   * Body: { cameraId?, source? }
   */
  fastify.post('/video/start', async (req, reply) => {
    const body      = req.body as { cameraId?: string; source?: string };
    const cameraId  = body?.cameraId || 'default';
    const camera    = getCameraById(cameraId);
    const source    = body?.source || String(camera?.source ?? 0);

    if (isRecording(cameraId)) {
      return reply.code(409).send({ error: 'Already recording' });
    }

    try {
      const filepath = await startRecording(cameraId, source);
      return reply.send({ success: true, cameraId, filepath });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: (err as Error).message });
    }
  });

  /**
   * POST /api/capture/video/stop
   * Body: { cameraId? }
   */
  fastify.post('/video/stop', async (req, reply) => {
    const body     = req.body as { cameraId?: string };
    const cameraId = body?.cameraId || 'default';

    if (!isRecording(cameraId)) {
      return reply.code(409).send({ error: 'Not currently recording' });
    }

    try {
      const { filepath, durationSec } = await stopRecording(cameraId);
      const media = await saveVideo(filepath, cameraId, durationSec);

      // Queue AI analysis on the first extracted frame (future enhancement)
      return reply.send({ success: true, media });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/capture/status
   */
  fastify.get('/status', async (_req, reply) => {
    const { listCameras } = await import('../../services/camera/cameraService');
    const cameras = listCameras();
    const status = cameras.map(c => ({
      cameraId:    c.id,
      name:        c.name,
      isRecording: isRecording(c.id),
    }));
    return reply.send({ cameras: status });
  });
};

export default captureRoutes;
