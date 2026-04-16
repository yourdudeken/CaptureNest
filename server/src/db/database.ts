import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';

// ─────────────────────────────────────────────────────────────────────────────
// SQLite database initialisation
// The database file lives alongside the media directory so it's easy to back up.
// ─────────────────────────────────────────────────────────────────────────────

const DB_PATH = process.env.DB_PATH || path.resolve('./capturenest.db');

let db: Database.Database;

export function initDatabase(): Database.Database {
  if (db) return db;

  // Ensure the directory exists
  fs.ensureDirSync(path.dirname(DB_PATH));

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  console.log(`[DB] Connected to SQLite at ${DB_PATH}`);
  return db;
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialised. Call initDatabase() first.');
  return db;
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema migrations (idempotent)
// ─────────────────────────────────────────────────────────────────────────────

function runMigrations(database: Database.Database): void {
  database.exec(`
    -- Users table for authentication
    CREATE TABLE IF NOT EXISTS users (
      id             TEXT PRIMARY KEY,
      username       TEXT UNIQUE NOT NULL,
      password_hash  TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Entries table (replaces media table for journal app)
    CREATE TABLE IF NOT EXISTS entries (
      id               TEXT PRIMARY KEY,
      type             TEXT NOT NULL CHECK(type IN ('text','audio','image','video','document')),
      title            TEXT,
      content          TEXT,
      original_file    TEXT,
      file_path        TEXT,
      thumbnail_path   TEXT,
      summary          TEXT,
      mood             TEXT,
      tags             TEXT NOT NULL DEFAULT '[]',
      source_text      TEXT,
      timestamp        TEXT NOT NULL DEFAULT (datetime('now')),
      ai_processed     INTEGER NOT NULL DEFAULT 0 CHECK(ai_processed IN (0,1)),
      file_size        INTEGER,
      duration_sec     REAL,
      mime_type        TEXT,
      metadata         TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON entries(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_entries_type      ON entries(type);
    CREATE INDEX IF NOT EXISTS idx_entries_ai       ON entries(ai_processed);

    -- Camera configurations
    CREATE TABLE IF NOT EXISTS cameras (
      id                  TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      type                TEXT NOT NULL CHECK(type IN ('webcam','rtsp','usb')),
      source              TEXT NOT NULL,
      enabled             INTEGER NOT NULL DEFAULT 1,
      motion_detection    INTEGER NOT NULL DEFAULT 0,
      scheduled_capture   INTEGER NOT NULL DEFAULT 0,
      schedule_interval   INTEGER NOT NULL DEFAULT 60
    );

    -- Application settings (key–value store)
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default settings if they don't exist
  const settingSeed = database.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );

  const defaults: [string, string][] = [
    ['ollama_url',            process.env.OLLAMA_URL    || 'http://ollama:11434'],
    ['ollama_model',          process.env.OLLAMA_MODEL  || 'llava'],
    ['qdrant_url',            process.env.QDRANT_URL    || 'http://qdrant:6333'],
    ['qdrant_collection',     'capturenest_entries'],
    ['media_path',            process.env.MEDIA_PATH    || './media'],
    ['default_camera_id',     'default'],
    ['ai_auto_analyze',       '1'],
    ['motion_detection',      '0'],
    ['thumbnail_width',       '400'],
    ['thumbnail_height',      '300'],
    ['max_file_size',         '524288000'],
  ];

  for (const [key, value] of defaults) {
    settingSeed.run(key, value);
  }

  // Seed a default camera if none exists
  const camCount = (database.prepare('SELECT COUNT(*) as c FROM cameras').get() as { c: number }).c;
  if (camCount === 0) {
    database.prepare(`
      INSERT INTO cameras (id, name, type, source, enabled, motion_detection, scheduled_capture, schedule_interval)
      VALUES ('default', 'Default Webcam', 'webcam', '0', 1, 0, 0, 60)
    `).run();
  }

  console.log('[DB] Migrations complete');
}
