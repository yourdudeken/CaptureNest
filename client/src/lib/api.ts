import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Typed API client for CaptureNest
// All requests go through Vite's proxy (/api → localhost:4000/api)
// ─────────────────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  timeout: 120_000,
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  type: 'image' | 'video';
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

export interface MediaStats {
  total: number;
  images: number;
  videos: number;
  analyzed: number;
  unanalyzed: number;
}

export interface CameraConfig {
  id: string;
  name: string;
  type: 'webcam' | 'rtsp' | 'usb';
  source: string | number;
  enabled: boolean;
  motionDetection: boolean;
  scheduledCapture: boolean;
  scheduleInterval: number;
}

export interface SearchResult extends MediaItem {
  score: number;
}

export interface HealthStatus {
  api: 'ok' | 'unavailable';
  ollama: 'ok' | 'unavailable';
  qdrant: 'ok' | 'unavailable';
}

// ── Media ─────────────────────────────────────────────────────────────────────

export const mediaApi = {
  list: (params?: { type?: string; limit?: number; offset?: number }) =>
    api.get<{ items: MediaItem[]; total: number }>('/media', { params }),

  get: (id: string) =>
    api.get<MediaItem>(`/media/${id}`),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/media/${id}`),

  reanalyze: (id: string) =>
    api.post(`/media/${id}/reanalyze`),

  stats: () =>
    api.get<MediaStats>('/media/stats/overview'),
};

// ── Capture ───────────────────────────────────────────────────────────────────

export const captureApi = {
  /** Send a base64 image (data URL accepted) */
  captureImage: (imageData: string, cameraId = 'default') =>
    api.post<{ success: boolean; media: MediaItem }>(
      `/capture/image?cameraId=${cameraId}`,
      { imageData },
    ),

  startRecording: (cameraId = 'default', source?: string) =>
    api.post('/capture/video/start', { cameraId, source }),

  stopRecording: (cameraId = 'default') =>
    api.post<{ success: boolean; media: MediaItem }>('/capture/video/stop', { cameraId }),

  status: () =>
    api.get<{ cameras: Array<{ cameraId: string; name: string; isRecording: boolean }> }>(
      '/capture/status'
    ),
};

// ── Search ────────────────────────────────────────────────────────────────────

export const searchApi = {
  search: (query: string, options?: { limit?: number; type?: string }) =>
    api.post<{ query: string; count: number; results: SearchResult[] }>('/search', {
      query,
      ...options,
    }),
};

// ── Cameras ───────────────────────────────────────────────────────────────────

export const cameraApi = {
  list: () =>
    api.get<{ cameras: CameraConfig[] }>('/camera'),

  add: (data: Omit<CameraConfig, 'id'>) =>
    api.post<CameraConfig>('/camera', data),

  update: (id: string, data: Partial<CameraConfig>) =>
    api.put<CameraConfig>(`/camera/${id}`, data),

  delete: (id: string) =>
    api.delete(`/camera/${id}`),
};

export const settingsApi = {
  get: () =>
    api.get<Record<string, string>>('/settings'),

  update: (data: Record<string, string>) =>
    api.put('/settings', data),

  health: () =>
    api.get<HealthStatus>('/settings/health'),

  models: () =>
    api.get<{ models: string[] }>('/settings/models'),
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  status: () =>
    api.get<{ isSetup: boolean }>('/auth/status'),

  setup: (payload: { username: string; password: string }) =>
    api.post<{ success: boolean; user: { id: string; username: string } }>('/auth/setup', payload),

  login: (payload: { username: string; password: string }) =>
    api.post<{ success: boolean; user: { id: string; username: string } }>('/auth/login', payload),

  logout: () =>
    api.post<{ success: boolean }>('/auth/logout'),

  me: () =>
    api.get<{ user: { id: string; username: string } }>('/auth/me'),
};

export default api;
