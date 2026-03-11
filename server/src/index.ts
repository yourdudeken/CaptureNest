import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './db/database';
import { initQdrant } from './services/ai/qdrantService';
import { ensureMediaDirs } from './services/media/mediaService';

import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

// Routes
import authRoutes from './api/routes/authRoutes';
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

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super-secret-capture-nest-token_change-me',
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });

  await app.register(fastifyCookie);

  // Serve captured media files statically
  const mediaRoot = path.resolve(process.env.MEDIA_PATH || './media');
  await app.register(fastifyStatic, {
    root: mediaRoot,
    prefix: '/media/',
    decorateReply: false,
  });

  // ── Initialise services ────────────────────────────────────────
  await ensureMediaDirs();
  initDatabase();
  await initQdrant();

  // ── API routes ─────────────────────────────────────────────────
  await app.register(authRoutes, { prefix: '/api/auth' });

  await app.register(async (api) => {
    // Validate JWT token cookie or authorization header in all these routes
    api.addHook('onRequest', async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.code(401).send({ error: 'Unauthorized user. Please login.' });
      }
    });

    api.register(captureRoutes, { prefix: '/capture' });
    api.register(mediaRoutes,   { prefix: '/media' });
    api.register(searchRoutes,  { prefix: '/search' });
    api.register(cameraRoutes,  { prefix: '/camera' });
    api.register(settingsRoutes,{ prefix: '/settings' });
  }, { prefix: '/api' });

  // Serve React frontend in production
  if (process.env.NODE_ENV === 'production') {
    app.log.info('Serving packaged frontend UI from /dist/public');
    const publicPath = path.resolve(__dirname, 'public');
    // Ensure we don't conflict with the /media router
    await app.register(fastifyStatic, {
      root: publicPath,
      decorateReply: false,
    });
    
    // SPA catch-all
    app.setNotFoundHandler((req, res) => {
      const stream = fs.createReadStream(path.join(publicPath, 'index.html'));
      res.type('text/html').send(stream);
    });
  }

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
