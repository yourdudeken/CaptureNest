# CaptureNest API Documentation

Base URL (dev): `http://localhost:4000`
Base URL (docker): proxied through `http://localhost:3000/api`

All request and response bodies are `application/json` unless noted.

---

## Health

### `GET /health`
Returns server status (no auth required).

**Response:**
```json
{ "status": "ok", "timestamp": "2026-03-10T08:00:00Z" }
```

---

## Capture

### `POST /api/capture/image`
Capture a still image from a camera.

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `cameraId` | string | `default` | Camera to capture from |

**Body options:**

Option A — `multipart/form-data`:
```
Field: media  (file)
```

Option B — `application/json`:
```json
{ "imageData": "data:image/jpeg;base64,/9j/..." }
```

**Response `201`:**
```json
{
  "success": true,
  "media": {
    "id": "uuid",
    "filename": "1710000000-uuid.jpg",
    "url": "/media/images/1710000000-uuid.jpg",
    "thumbnailUrl": "/media/thumbnails/thumb-1710000000-uuid.jpg",
    "type": "image",
    "timestamp": "2026-03-10T08:00:00.000Z",
    "tags": [],
    "description": null,
    "cameraId": "default",
    "aiProcessed": false
  }
}
```

---

### `POST /api/capture/video/start`
Start recording video.

**Body:**
```json
{ "cameraId": "default", "source": "0" }
```

**Response `200`:**
```json
{ "success": true, "cameraId": "default", "filepath": "/media/videos/..." }
```

---

### `POST /api/capture/video/stop`
Stop active recording and save the video.

**Body:**
```json
{ "cameraId": "default" }
```

**Response `200`:**
```json
{ "success": true, "media": { /* MediaItem */ } }
```

---

### `GET /api/capture/status`
Get recording status for all cameras.

**Response:**
```json
{
  "cameras": [
    { "cameraId": "default", "name": "Default Webcam", "isRecording": false }
  ]
}
```

---

## Media

### `GET /api/media`
List media with optional filters.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `type` | `image` \| `video` | Filter by type |
| `cameraId` | string | Filter by camera |
| `limit` | number (max 200) | Results per page (default 50) |
| `offset` | number | Pagination offset |
| `aiProcessed` | `0` \| `1` | Filter by analysis status |

**Response:**
```json
{
  "items": [ /* MediaItem[] */ ],
  "total": 142,
  "limit": 50,
  "offset": 0
}
```

---

### `GET /api/media/stats/overview`
Get aggregate media counts.

**Response:**
```json
{
  "total": 142,
  "images": 130,
  "videos": 12,
  "analyzed": 128,
  "unanalyzed": 14
}
```

---

### `GET /api/media/:id`
Get a single media item by UUID.

**Response:** `MediaItem` or `404`.

---

### `DELETE /api/media/:id`
Delete media item, its files, and its vector embedding.

**Response:**
```json
{ "success": true, "id": "uuid" }
```

---

### `POST /api/media/:id/reanalyze`
Re-run AI analysis on an existing image.

**Response:**
```json
{ "success": true, "message": "Re-analysis queued" }
```

---

## Search

### `POST /api/search`
Semantic search using natural language.

**Body:**
```json
{
  "query": "person at a desk with laptop",
  "limit": 20,
  "minScore": 0.25,
  "type": "all"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `query` | string | *required* | Natural language query |
| `limit` | number | `20` | Max results |
| `minScore` | number | `0.25` | Minimum similarity score (0–1) |
| `type` | `all` \| `image` \| `video` | `all` | Filter by media type |

**Response:**
```json
{
  "query": "person at a desk with laptop",
  "count": 5,
  "results": [
    {
      "id": "uuid",
      "score": 0.847,
      "url": "/media/images/...",
      "description": "A person sitting at a desk using a laptop",
      "tags": ["person", "desk", "laptop", "indoor"],
      ...
    }
  ]
}
```

---

## Cameras

### `GET /api/camera`
List all configured cameras.

### `POST /api/camera`
Add a camera.

**Body:**
```json
{
  "name": "Front Door",
  "type": "rtsp",
  "source": "rtsp://192.168.1.100:554/stream",
  "enabled": true,
  "motionDetection": false,
  "scheduledCapture": false,
  "scheduleInterval": 60
}
```

### `PUT /api/camera/:id`
Update a camera (partial).

### `DELETE /api/camera/:id`
Remove a camera.

---

## Settings

### `GET /api/settings`
Get all settings as a key-value map.

### `PUT /api/settings`
Update settings.

**Body:**
```json
{
  "ollama_model": "llava:13b",
  "ai_auto_analyze": "1"
}
```

### `GET /api/settings/health`
Health check for all dependent services.

**Response:**
```json
{
  "api": "ok",
  "ollama": "ok",
  "qdrant": "unavailable"
}
```

### `GET /api/settings/models`
List models available in Ollama.

**Response:**
```json
{ "models": ["llava", "llava:13b", "nomic-embed-text"] }
```

---

## MediaItem Schema

```typescript
interface MediaItem {
  id:           string;       // UUID
  filename:     string;
  url:          string;       // e.g. /media/images/file.jpg
  thumbnailUrl: string | null;
  type:         'image' | 'video';
  timestamp:    string;       // ISO-8601
  tags:         string[];
  description:  string | null;
  cameraId:     string;
  durationSec:  number | null;  // videos only
  fileSize:     number | null;  // bytes
  width:        number | null;
  height:       number | null;
  aiProcessed:  boolean;
}
```
