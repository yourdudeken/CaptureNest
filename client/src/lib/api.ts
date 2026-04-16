import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120_000,
});

export type EntryType = 'text' | 'audio' | 'image' | 'video' | 'document';

// Add legacy properties for backwards compatibility
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
  // Legacy properties for backwards compatibility
  url: string;
  filename: string;
  description: string | null;
  // MediaDetail properties
  cameraId?: string;
  width?: number | null;
  height?: number | null;
}

export interface EntryStats {
  total: number;
  text: number;
  audio: number;
  image: number;
  video: number;
  document: number;
  analyzed: number;
}

export interface SearchResult extends Entry {
  score: number;
}

export interface HealthStatus {
  api: 'ok' | 'unavailable';
  ollama: 'ok' | 'unavailable';
  qdrant: 'ok' | 'unavailable';
}

// Legacy type aliases for backwards compatibility
export type MediaItem = Entry;
export type MediaStats = EntryStats;
export type CameraConfig = {
  id: string;
  name: string;
  type: 'webcam' | 'rtsp' | 'usb';
  source: string | number;
  enabled: boolean;
  motionDetection: boolean;
  scheduledCapture: boolean;
  scheduleInterval: number;
};

export const entryApi = {
  list: (params?: { 
    type?: EntryType; 
    limit?: number; 
    offset?: number; 
    aiProcessed?: boolean;
    tag?: string;
  }) =>
    api.get<{ items: Entry[]; total: number }>('/entries', { params }),

  get: (id: string) =>
    api.get<Entry>(`/entries/${id}`),

  createText: (content: string) =>
    api.post<{ status: string }>('/entries/text', { content }),

  createAudio: (file: File, duration?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (duration) headers['x-duration'] = String(duration);
    return api.post<Entry>('/entries/audio', formData, { headers });
  },

  createImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Entry>('/entries/image', formData);
  },

  createVideo: (file: File, duration?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (duration) headers['x-duration'] = String(duration);
    return api.post<Entry>('/entries/video', formData, { headers });
  },

  createDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Entry>('/entries/document', formData);
  },

  delete: (id: string) =>
    api.delete<{ status: string }>(`/entries/${id}`),

  reanalyze: (id: string) =>
    api.post<{ status: string }>(`/entries/${id}/reanalyze`),
};

export const searchApi = {
  search: (query: string, options?: { limit?: number; type?: EntryType | 'all' }) =>
    api.post<{ query: string; count: number; results: SearchResult[] }>('/search', {
      query,
      ...options,
    }),
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

// Legacy API aliases for backwards compatibility
export const mediaApi = {
  list: (params?: { type?: string; limit?: number; offset?: number }) =>
    api.get<{ items: Entry[]; total: number }>('/entries', { params }),
  get: (id: string) =>
    api.get<Entry>(`/entries/${id}`),
  delete: (id: string) =>
    api.delete<{ status: string }>(`/entries/${id}`),
  reanalyze: (id: string) =>
    api.post<{ status: string }>(`/entries/${id}/reanalyze`),
  stats: () =>
    api.get<EntryStats>('/entries'),
};

export const captureApi = {
  captureImage: (imageData: string, cameraId = 'default') =>
    api.post<{ success: boolean; media: Entry }>(
      `/entries/image?cameraId=${cameraId}`,
      { imageData },
    ),
  startRecording: (cameraId = 'default', source?: string) =>
    api.post('/entries/video/start', { cameraId, source }),
  stopRecording: (cameraId = 'default') =>
    api.post<{ success: boolean; media: Entry }>('/entries/video/stop', { cameraId }),
  status: () =>
    api.get<{ cameras: Array<{ cameraId: string; name: string; isRecording: boolean }> }>(
      '/entries/video/status'
    ),
};

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

export default api;