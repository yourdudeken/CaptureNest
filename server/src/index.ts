import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fs from 'fs';
import path from 'path';
import { initDatabase } from './db/database';
import { initQdrant } from './services/ai/qdrantService';
import { ensureMediaDirs } from './services/media/mediaService';

// Routes
import captureRoutes from './api/routes/captureRoutes';
import mediaRoutes from './api/routes/mediaRoutes';
import searchRoutes from './api/routes/searchRoutes';
import cameraRoutes from './api/routes/cameraRoutes';
import settingsRoutes from './api/routes/settingsRoutes';

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // ── Plugins ────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await app.register(multipart, {
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000', 10) }, // 500MB
  });

  // Serve captured media files statically
  const mediaRoot = path.resolve(process.env.MEDIA_PATH || './media');
  await app.register(fastifyStatic, {
    root: mediaRoot,
    prefix: '/media/',
    decorateReply: false,
  });

  // Serve Web UI if built (turns CaptureNest into a monolith)
  const webDist = process.env.WEB_DIST_PATH 
    ? path.resolve(process.env.WEB_DIST_PATH) 
    : path.resolve(__dirname, '../../web/dist');

  if (fs.existsSync(webDist)) {
    await app.register(async (instance) => {
      await instance.register(fastifyStatic, {
        root: webDist,
        prefix: '/',
        wildcard: false, // Turn off wildcard so we can handle SPA fallback
      });

      instance.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith('/api') || request.url.startsWith('/media')) {
          reply.status(404).send({ error: 'Not Found' });
        } else {
          reply.sendFile('index.html');
        }
      });
    });
  }

  // ── Initialise services ────────────────────────────────────────
  await ensureMediaDirs();
  initDatabase();
  await initQdrant();

  // ── API routes ─────────────────────────────────────────────────
  await app.register(captureRoutes, { prefix: '/api/capture' });
  await app.register(mediaRoutes,   { prefix: '/api/media' });
  await app.register(searchRoutes,  { prefix: '/api/search' });
  await app.register(cameraRoutes,  { prefix: '/api/camera' });
  await app.register(settingsRoutes,{ prefix: '/api/settings' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // ── Start ──────────────────────────────────────────────────────
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`CaptureNest API running on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
