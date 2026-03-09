const express = require('express');
const cors = require('cors');
const knex = require('knex');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploads');
const galleryRoutes = require('./routes/gallery');
const qrAuthRoutes = require('./routes/qr-auth');

const app = express();

// CORS configuration for development and production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// configure DB (Postgres)
const db = knex({
  client: 'pg',
  connection: {
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'CaptureNest',
    port: process.env.PGPORT || 5433
  }
});
app.set('db', db);

// routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/qr-auth', qrAuthRoutes);

// static serving when using local filesystem storage
if (process.env.STORAGE_TYPE !== 's3') {
  const mediaPath = process.env.LOCAL_MEDIA_PATH || './media';
  console.log(`Setting up static file serving from: ${mediaPath}`);
  console.log(`Resolved path: ${require('path').resolve(mediaPath)}`);
  app.use('/media', express.static(mediaPath));

  // Debug middleware to log media requests
  app.use('/media', (req, res, next) => {
    console.log(`Media request: ${req.url}`);
    console.log(`Full path would be: ${require('path').join(mediaPath, req.url)}`);
    next();
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
