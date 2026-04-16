// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript type definitions for the CaptureNest server
// ─────────────────────────────────────────────────────────────────────────────

export type EntryType = 'text' | 'audio' | 'image' | 'video' | 'document';
export type MediaType = 'image' | 'video';
export type CaptureStatus = 'idle' | 'capturing' | 'recording' | 'processing';

/** Raw database row for an entry */
export interface EntryRecord {
  id: string;
  type: EntryType;
  title: string | null;
  content: string | null;
  original_file: string | null;
  file_path: string | null;
  thumbnail_path: string | null;
  summary: string | null;
  mood: string | null;
  tags: string;
  source_text: string | null;
  timestamp: string;
  ai_processed: 0 | 1;
  file_size: number | null;
  duration_sec: number | null;
  mime_type: string | null;
  metadata: string | null;
}

/** Hydrated entry object returned by the API */
export interface Entry {
  id: string;
  type: EntryType;
  title: string | null;
  content: string | null;
  originalFile: string | null;
  filePath: string | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  summary: string | null;
  mood: string | null;
  tags: string[];
  sourceText: string | null;
  timestamp: string;
  aiProcessed: boolean;
  fileSize: number | null;
  durationSec: number | null;
  mimeType: string | null;
  metadata: Record<string, unknown> | null;
}

/** AI analysis result returned by the AI service */
export interface AIAnalysis {
  description: string;
  tags: string[];
  objects?: string[];
  scene?: string;
  confidence?: number;
}

/** AI structuring result for journal entries */
export interface AIStructuredEntry {
  title: string;
  content: string;
  summary: string;
  mood: string | null;
  tags: string[];
}

/** Camera configuration */
export interface CameraConfig {
  id: string;
  name: string;
  type: 'webcam' | 'rtsp' | 'usb';
  source: string | number;   // URL for RTSP, device index for webcam/USB
  enabled: boolean;
  motionDetection: boolean;
  scheduledCapture: boolean;
  scheduleInterval: number;  // seconds
}

/** Application settings stored in DB */
export interface AppSettings {
  ollamaUrl: string;
  ollamaModel: string;
  qdrantUrl: string;
  qdrantCollection: string;
  mediaPath: string;
  defaultCameraId: string;
  aiAutoAnalyze: boolean;
  motionDetectionEnabled: boolean;
  thumbnailWidth: number;
  thumbnailHeight: number;
  maxFileSize: number;
}

/** Qdrant point payload for entries */
export interface QdrantPayload {
  [key: string]: unknown;
  entryId: string;
  content: string;
  summary: string | null;
  tags: string[];
  mood: string | null;
  timestamp: string;
  type: EntryType;
  thumbnailUrl: string | null;
}

/** Natural language search result */
export interface SearchResult {
  entry: Entry;
  score: number;
}
