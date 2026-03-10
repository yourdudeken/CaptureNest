// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript type definitions for the CaptureNest server
// ─────────────────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video';
export type CaptureStatus = 'idle' | 'capturing' | 'recording' | 'processing';

/** Raw database row for a media record */
export interface MediaRecord {
  id: string;
  filename: string;
  filepath: string;
  thumbnail_path: string | null;
  type: MediaType;
  timestamp: string;         // ISO-8601
  tags: string;              // JSON array serialised as string
  description: string | null;
  camera_id: string;
  duration_sec: number | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  ai_processed: 0 | 1;      // SQLite boolean
}

/** Hydrated media object returned by the API */
export interface MediaItem {
  id: string;
  filename: string;
  filepath: string;
  url: string;               // e.g. /media/images/xxx.jpg
  thumbnailUrl: string | null;
  type: MediaType;
  timestamp: string;
  tags: string[];
  description: string | null;
  cameraId: string;
  durationSec: number | null;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  aiProcessed: boolean;
}

/** AI analysis result returned by the AI service */
export interface AIAnalysis {
  description: string;
  tags: string[];
  objects?: string[];
  scene?: string;
  confidence?: number;
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

/** Qdrant point payload */
export interface QdrantPayload {
  [key: string]: unknown;
  mediaId: string;
  description: string;
  tags: string[];
  timestamp: string;
  type: MediaType;
  thumbnailUrl: string | null;
}

/** Natural language search result */
export interface SearchResult {
  mediaItem: MediaItem;
  score: number;
}
