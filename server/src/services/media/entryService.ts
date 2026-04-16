import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../db/database';
import { Entry, EntryRecord, EntryType } from '../../types';

export const MEDIA_ROOT = path.resolve(process.env.MEDIA_PATH || './media');
export const AUDIO_DIR = path.join(MEDIA_ROOT, 'audio');
export const IMAGES_DIR = path.join(MEDIA_ROOT, 'images');
export const VIDEOS_DIR = path.join(MEDIA_ROOT, 'videos');
export const DOCUMENTS_DIR = path.join(MEDIA_ROOT, 'documents');
export const THUMBS_DIR = path.join(MEDIA_ROOT, 'thumbnails');

export async function ensureMediaDirs(): Promise<void> {
  await fs.ensureDir(AUDIO_DIR);
  await fs.ensureDir(IMAGES_DIR);
  await fs.ensureDir(VIDEOS_DIR);
  await fs.ensureDir(DOCUMENTS_DIR);
  await fs.ensureDir(THUMBS_DIR);
  console.log('[Entry] Storage directories verified');
}

export async function saveTextEntry(data: {
  title?: string;
  content: string;
  summary?: string;
  mood?: string;
  tags?: string[];
  sourceText?: string;
}): Promise<Entry> {
  const id = uuidv4();
  const timestamp = new Date().toISOString();

  const record: EntryRecord = {
    id,
    type: 'text',
    title: data.title || null,
    content: data.content,
    original_file: null,
    file_path: null,
    thumbnail_path: null,
    summary: data.summary || null,
    mood: data.mood || null,
    tags: JSON.stringify(data.tags || []),
    source_text: data.sourceText || data.content,
    timestamp,
    ai_processed: 1,
    file_size: null,
    duration_sec: null,
    mime_type: 'text/plain',
    metadata: null,
  };

  getDb().prepare(`
    INSERT INTO entries (id, type, title, content, original_file, file_path, thumbnail_path, summary, mood, tags, source_text, timestamp, ai_processed, file_size, duration_sec, mime_type, metadata)
    VALUES (@id, @type, @title, @content, @original_file, @file_path, @thumbnail_path, @summary, @mood, @tags, @source_text, @timestamp, @ai_processed, @file_size, @duration_sec, @mime_type, @metadata)
  `).run(record);

  return rowToEntry(record);
}

export async function saveAudioEntry(
  buffer: Buffer,
  originalName?: string,
  durationSec?: number
): Promise<Entry> {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  const ext = path.extname(originalName || '.webm').slice(1) || 'webm';
  const filename = `${Date.now()}-${id}.${ext}`;
  const filepath = path.join(AUDIO_DIR, filename);

  await fs.writeFile(filepath, buffer);
  const fileSize = await fs.stat(filepath).then(s => s.size);

  const record: EntryRecord = {
    id,
    type: 'audio',
    title: null,
    content: null,
    original_file: originalName || null,
    file_path: filepath,
    thumbnail_path: null,
    summary: null,
    mood: null,
    tags: '[]',
    source_text: null,
    timestamp,
    ai_processed: 0,
    file_size: fileSize,
    duration_sec: durationSec ?? null,
    mime_type: `audio/${ext}`,
    metadata: null,
  };

  getDb().prepare(`
    INSERT INTO entries (id, type, title, content, original_file, file_path, thumbnail_path, summary, mood, tags, source_text, timestamp, ai_processed, file_size, duration_sec, mime_type, metadata)
    VALUES (@id, @type, @title, @content, @original_file, @file_path, @thumbnail_path, @summary, @mood, @tags, @source_text, @timestamp, @ai_processed, @file_size, @duration_sec, @mime_type, @metadata)
  `).run(record);

  return rowToEntry(record);
}

export async function saveImageEntry(
  buffer: Buffer,
  originalName?: string
): Promise<Entry> {
  const id = uuidv4();
  const filename = `${Date.now()}-${id}.jpg`;
  const filepath = path.join(IMAGES_DIR, filename);
  const thumbPath = path.join(THUMBS_DIR, `thumb-${filename}`);

  const info = await sharp(buffer)
    .jpeg({ quality: 92 })
    .toFile(filepath);

  await sharp(buffer)
    .resize(400, 300, { fit: 'cover' })
    .jpeg({ quality: 75 })
    .toFile(thumbPath);

  const fileSize = await fs.stat(filepath).then(s => s.size);

  const record: EntryRecord = {
    id,
    type: 'image',
    title: null,
    content: null,
    original_file: originalName || null,
    file_path: filepath,
    thumbnail_path: thumbPath,
    summary: null,
    mood: null,
    tags: '[]',
    source_text: null,
    timestamp: new Date().toISOString(),
    ai_processed: 0,
    file_size: fileSize,
    duration_sec: null,
    mime_type: 'image/jpeg',
    metadata: JSON.stringify({ width: info.width, height: info.height }),
  };

  getDb().prepare(`
    INSERT INTO entries (id, type, title, content, original_file, file_path, thumbnail_path, summary, mood, tags, source_text, timestamp, ai_processed, file_size, duration_sec, mime_type, metadata)
    VALUES (@id, @type, @title, @content, @original_file, @file_path, @thumbnail_path, @summary, @mood, @tags, @source_text, @timestamp, @ai_processed, @file_size, @duration_sec, @mime_type, @metadata)
  `).run(record);

  return rowToEntry(record);
}

export async function saveVideoEntry(
  filepath: string,
  originalName?: string,
  durationSec?: number
): Promise<Entry> {
  const id = uuidv4();
  const filename = path.basename(filepath);
  const stat = await fs.stat(filepath);

  let thumbPath: string | null = null;
  try {
    const { extractVideoThumbnail } = await import('./ffmpegService');
    thumbPath = path.join(THUMBS_DIR, `thumb-${id}.jpg`);
    await extractVideoThumbnail(filepath, thumbPath);
  } catch {}

  const record: EntryRecord = {
    id,
    type: 'video',
    title: null,
    content: null,
    original_file: originalName || null,
    file_path: filepath,
    thumbnail_path: thumbPath,
    summary: null,
    mood: null,
    tags: '[]',
    source_text: null,
    timestamp: new Date().toISOString(),
    ai_processed: 0,
    file_size: stat.size,
    duration_sec: durationSec ?? null,
    mime_type: 'video/mp4',
    metadata: null,
  };

  getDb().prepare(`
    INSERT INTO entries (id, type, title, content, original_file, file_path, thumbnail_path, summary, mood, tags, source_text, timestamp, ai_processed, file_size, duration_sec, mime_type, metadata)
    VALUES (@id, @type, @title, @content, @original_file, @file_path, @thumbnail_path, @summary, @mood, @tags, @source_text, @timestamp, @ai_processed, @file_size, @duration_sec, @mime_type, @metadata)
  `).run(record);

  return rowToEntry(record);
}

export async function saveDocumentEntry(
  buffer: Buffer,
  originalName: string
): Promise<Entry> {
  const id = uuidv4();
  const ext = path.extname(originalName).slice(1) || 'txt';
  const filename = `${Date.now()}-${id}.${ext}`;
  const filepath = path.join(DOCUMENTS_DIR, filename);

  await fs.writeFile(filepath, buffer);
  const fileSize = await fs.stat(filepath).then(s => s.size);

  const record: EntryRecord = {
    id,
    type: 'document',
    title: originalName,
    content: null,
    original_file: originalName,
    file_path: filepath,
    thumbnail_path: null,
    summary: null,
    mood: null,
    tags: '[]',
    source_text: null,
    timestamp: new Date().toISOString(),
    ai_processed: 0,
    file_size: fileSize,
    duration_sec: null,
    mime_type: getMimeType(ext),
    metadata: null,
  };

  getDb().prepare(`
    INSERT INTO entries (id, type, title, content, original_file, file_path, thumbnail_path, summary, mood, tags, source_text, timestamp, ai_processed, file_size, duration_sec, mime_type, metadata)
    VALUES (@id, @type, @title, @content, @original_file, @file_path, @thumbnail_path, @summary, @mood, @tags, @source_text, @timestamp, @ai_processed, @file_size, @duration_sec, @mime_type, @metadata)
  `).run(record);

  return rowToEntry(record);
}

function getMimeType(ext: string): string {
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    md: 'text/markdown',
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

export function listEntries(opts: {
  type?: EntryType;
  limit?: number;
  offset?: number;
  aiProcessed?: boolean;
  tag?: string;
}): { items: Entry[]; total: number } {
  const db = getDb();
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (opts.type) {
    where.push('type = @type');
    params.type = opts.type;
  }
  if (opts.aiProcessed !== undefined) {
    where.push('ai_processed = @ai_processed');
    params.ai_processed = opts.aiProcessed ? 1 : 0;
  }
  if (opts.tag) {
    where.push('tags LIKE @tag');
    params.tag = `%${opts.tag}%`;
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const total = (db.prepare(`SELECT COUNT(*) as c FROM entries ${clause}`).get(params) as { c: number }).c;
  const rows = db.prepare(`SELECT * FROM entries ${clause} ORDER BY timestamp DESC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset }) as EntryRecord[];

  return { items: rows.map(rowToEntry), total };
}

export function getEntryById(id: string): Entry | null {
  const row = getDb().prepare('SELECT * FROM entries WHERE id = ?').get(id) as EntryRecord | undefined;
  return row ? rowToEntry(row) : null;
}

export function updateEntryAnalysis(
  id: string,
  title: string | null,
  content: string | null,
  summary: string | null,
  mood: string | null,
  tags: string[]
): void {
  getDb().prepare(`
    UPDATE entries SET title = ?, content = ?, summary = ?, mood = ?, tags = ?, ai_processed = 1 WHERE id = ?
  `).run(title, content, summary, mood, JSON.stringify(tags), id);
}

export function updateEntrySourceText(id: string, sourceText: string): void {
  getDb().prepare(`UPDATE entries SET source_text = ? WHERE id = ?`).run(sourceText, id);
}

export async function deleteEntry(id: string): Promise<boolean> {
  const row = getDb().prepare('SELECT * FROM entries WHERE id = ?').get(id) as EntryRecord | undefined;
  if (!row) return false;

  if (row.file_path) {
    await fs.remove(row.file_path).catch(() => null);
  }
  if (row.thumbnail_path) {
    await fs.remove(row.thumbnail_path).catch(() => null);
  }

  getDb().prepare('DELETE FROM entries WHERE id = ?').run(id);
  return true;
}

function rowToEntry(row: EntryRecord): Entry {
  const baseDir = getBaseDir(row.type);
  let fileUrl: string | null = null;
  if (row.file_path) {
    const fileName = path.basename(row.file_path);
    fileUrl = `/media/${baseDir}/${fileName}`;
  }

  let thumbUrl: string | null = null;
  if (row.thumbnail_path) {
    const thumbFile = path.basename(row.thumbnail_path);
    thumbUrl = `/media/thumbnails/${thumbFile}`;
  }

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    originalFile: row.original_file,
    filePath: row.file_path,
    fileUrl,
    thumbnailUrl: thumbUrl,
    summary: row.summary,
    mood: row.mood,
    tags: JSON.parse(row.tags || '[]'),
    sourceText: row.source_text,
    timestamp: row.timestamp,
    aiProcessed: row.ai_processed === 1,
    fileSize: row.file_size,
    durationSec: row.duration_sec,
    mimeType: row.mime_type,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

function getBaseDir(type: EntryType): string {
  const dirs: Record<EntryType, string> = {
    text: 'text',
    audio: 'audio',
    image: 'images',
    video: 'videos',
    document: 'documents',
  };
  return dirs[type];
}