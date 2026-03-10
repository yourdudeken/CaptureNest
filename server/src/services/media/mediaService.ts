import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/database';
import { MediaItem, MediaRecord, MediaType } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Media Storage Service
// Handles file organisation, thumbnail generation, and DB persistence.
// ─────────────────────────────────────────────────────────────────────────────

export const MEDIA_ROOT  = path.resolve(process.env.MEDIA_PATH || './media');
export const IMAGES_DIR  = path.join(MEDIA_ROOT, 'images');
export const VIDEOS_DIR  = path.join(MEDIA_ROOT, 'videos');
export const THUMBS_DIR  = path.join(MEDIA_ROOT, 'thumbnails');

/** Create all required media directories on startup */
export async function ensureMediaDirs(): Promise<void> {
  await fs.ensureDir(IMAGES_DIR);
  await fs.ensureDir(VIDEOS_DIR);
  await fs.ensureDir(THUMBS_DIR);
  console.log('[Media] Storage directories verified');
}

/** Save a Buffer as an image file and return the persisted MediaItem */
export async function saveImage(
  buffer: Buffer,
  cameraId = 'default',
  originalName?: string
): Promise<MediaItem> {
  const id       = uuidv4();
  const filename = `${Date.now()}-${id}.jpg`;
  const filepath = path.join(IMAGES_DIR, filename);

  // Convert/optimise to JPEG via sharp
  const info = await sharp(buffer)
    .jpeg({ quality: 92 })
    .toFile(filepath);

  // Generate thumbnail
  const thumbName = `thumb-${filename}`;
  const thumbPath = path.join(THUMBS_DIR, thumbName);
  await sharp(buffer)
    .resize(400, 300, { fit: 'cover' })
    .jpeg({ quality: 75 })
    .toFile(thumbPath);

  const fileSize = await fs.stat(filepath).then(s => s.size);

  const record = {
    id,
    filename,
    filepath,
    thumbnail_path: thumbPath,
    type: 'image' as MediaType,
    timestamp: new Date().toISOString(),
    tags: '[]',
    description: null,
    camera_id: cameraId,
    duration_sec: null,
    file_size: fileSize,
    width: info.width,
    height: info.height,
    ai_processed: 0 as const,
  };

  getDb().prepare(`
    INSERT INTO media (id, filename, filepath, thumbnail_path, type, timestamp, tags, description, camera_id, duration_sec, file_size, width, height, ai_processed)
    VALUES (@id, @filename, @filepath, @thumbnail_path, @type, @timestamp, @tags, @description, @camera_id, @duration_sec, @file_size, @width, @height, @ai_processed)
  `).run(record);

  return rowToItem(record as MediaRecord);
}

/** Register a recorded video file in the database */
export async function saveVideo(
  filepath: string,
  cameraId = 'default',
  durationSec?: number
): Promise<MediaItem> {
  const id       = uuidv4();
  const filename = path.basename(filepath);
  const stat     = await fs.stat(filepath);

  // Video thumbnail – extract first frame via ffmpeg (best-effort)
  let thumbPath: string | null = null;
  try {
    const { extractVideoThumbnail } = await import('./ffmpegService');
    const thumbName = `thumb-${id}.jpg`;
    thumbPath = path.join(THUMBS_DIR, thumbName);
    await extractVideoThumbnail(filepath, thumbPath);
  } catch (_) {
    // Thumbnail extraction is optional
  }

  const record = {
    id,
    filename,
    filepath,
    thumbnail_path: thumbPath,
    type: 'video' as MediaType,
    timestamp: new Date().toISOString(),
    tags: '[]',
    description: null,
    camera_id: cameraId,
    duration_sec: durationSec ?? null,
    file_size: stat.size,
    width: null,
    height: null,
    ai_processed: 0 as const,
  };

  getDb().prepare(`
    INSERT INTO media (id, filename, filepath, thumbnail_path, type, timestamp, tags, description, camera_id, duration_sec, file_size, width, height, ai_processed)
    VALUES (@id, @filename, @filepath, @thumbnail_path, @type, @timestamp, @tags, @description, @camera_id, @duration_sec, @file_size, @width, @height, @ai_processed)
  `).run(record);

  return rowToItem(record as MediaRecord);
}

/** List media with optional filters */
export function listMedia(opts: {
  type?: MediaType;
  cameraId?: string;
  limit?: number;
  offset?: number;
  aiProcessed?: boolean;
}): { items: MediaItem[]; total: number } {
  const db     = getDb();
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (opts.type)      { where.push('type = @type');                params.type     = opts.type; }
  if (opts.cameraId)  { where.push('camera_id = @cameraId');       params.cameraId = opts.cameraId; }
  if (opts.aiProcessed !== undefined) {
    where.push('ai_processed = @ai_processed');
    params.ai_processed = opts.aiProcessed ? 1 : 0;
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit  = opts.limit  ?? 50;
  const offset = opts.offset ?? 0;

  const total = (db.prepare(`SELECT COUNT(*) as c FROM media ${clause}`).get(params) as { c: number }).c;
  const rows  = db.prepare(`SELECT * FROM media ${clause} ORDER BY timestamp DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset }) as MediaRecord[];

  return { items: rows.map(rowToItem), total };
}

/** Get a single media item by ID */
export function getMediaById(id: string): MediaItem | null {
  const row = getDb().prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRecord | undefined;
  return row ? rowToItem(row) : null;
}

/** Update AI analysis fields */
export function updateMediaAnalysis(
  id: string,
  description: string,
  tags: string[]
): void {
  getDb().prepare(`
    UPDATE media SET description = ?, tags = ?, ai_processed = 1 WHERE id = ?
  `).run(description, JSON.stringify(tags), id);
}

/** Delete a media item and its files */
export async function deleteMedia(id: string): Promise<boolean> {
  const row = getDb().prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRecord | undefined;
  if (!row) return false;

  // Remove physical files
  await fs.remove(row.filepath).catch(() => null);
  if (row.thumbnail_path) await fs.remove(row.thumbnail_path).catch(() => null);

  getDb().prepare('DELETE FROM media WHERE id = ?').run(id);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: map DB row to API-facing MediaItem
// ─────────────────────────────────────────────────────────────────────────────

function rowToItem(row: MediaRecord): MediaItem {
  const base = row.type === 'image' ? 'images' : 'videos';
  const url  = `/media/${base}/${row.filename}`;

  let thumbUrl: string | null = null;
  if (row.thumbnail_path) {
    const thumbFile = path.basename(row.thumbnail_path);
    thumbUrl = `/media/thumbnails/${thumbFile}`;
  }

  return {
    id:           row.id,
    filename:     row.filename,
    filepath:     row.filepath,
    url,
    thumbnailUrl: thumbUrl,
    type:         row.type,
    timestamp:    row.timestamp,
    tags:         JSON.parse(row.tags || '[]'),
    description:  row.description,
    cameraId:     row.camera_id,
    durationSec:  row.duration_sec,
    fileSize:     row.file_size,
    width:        row.width,
    height:       row.height,
    aiProcessed:  row.ai_processed === 1,
  };
}
