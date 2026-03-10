import { getDb } from '../../db/database';
import { AppSettings } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Settings Service
// Reads and writes key–value pairs from the `settings` SQLite table.
// A module-level cache avoids hitting the DB on every hot path.
// ─────────────────────────────────────────────────────────────────────────────

let settingsCache: AppSettings | null = null;

export function getSettings(): AppSettings {
  if (settingsCache) return settingsCache;

  const db   = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const map  = Object.fromEntries(rows.map(r => [r.key, r.value]));

  settingsCache = {
    ollamaUrl:             map['ollama_url']          || 'http://ollama:11434',
    ollamaModel:           map['ollama_model']         || 'llava',
    qdrantUrl:             map['qdrant_url']           || 'http://qdrant:6333',
    qdrantCollection:      map['qdrant_collection']    || 'capturenest_media',
    mediaPath:             map['media_path']           || './media',
    defaultCameraId:       map['default_camera_id']    || 'default',
    aiAutoAnalyze:         map['ai_auto_analyze']      === '1',
    motionDetectionEnabled:map['motion_detection']     === '1',
    thumbnailWidth:        parseInt(map['thumbnail_width']  || '400', 10),
    thumbnailHeight:       parseInt(map['thumbnail_height'] || '300', 10),
    maxFileSize:           parseInt(map['max_file_size']    || '524288000', 10),
  };

  return settingsCache;
}

export function updateSettings(updates: Partial<Record<string, string>>): void {
  const db   = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(key, value);
    }
  });
  tx();

  // Bust the cache so next call re-reads
  settingsCache = null;
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb()
    .prepare('SELECT key, value FROM settings')
    .all() as Array<{ key: string; value: string }>;
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}
