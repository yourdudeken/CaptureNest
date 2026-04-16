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
{ "status": "ok", "timestamp": "2026-04-16T08:00:00Z" }
```

---

## Entries

### `GET /api/entries`
List journal entries with optional filters.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `type` | `text` \| `audio` \| `image` \| `video` \| `document` | Filter by type |
| `limit` | number | Results per page (default 50) |
| `offset` | number | Pagination offset |
| `aiProcessed` | `true` \| `false` | Filter by analysis status |
| `tag` | string | Filter by tag |

**Response:**
```json
{
  "items": [ /* Entry[] */ ],
  "total": 142
}
```

---

### `GET /api/entries/:id`
Get a single entry by UUID.

**Response:** `Entry` or `404`.

---

### `POST /api/entries/text`
Create a text journal entry. AI processes immediately.

**Body:**
```json
{ "content": "Today I went for a walk in the park and felt really peaceful..." }
```

**Response `202`:**
```json
{ "status": "processing" }
```

The entry is created with AI-generated: title, summary, mood, tags.

---

### `POST /api/entries/audio`
Upload an audio recording. AI processes asynchronously.

**Headers:**
- `Content-Type: multipart/form-data`
- `x-duration` (optional): Duration in seconds

**Body (form-data):**
```
Field: file  (audio file: webm, mp3, wav, etc.)
```

**Response `201`:**
```json
{
  "id": "uuid",
  "type": "audio",
  "fileUrl": "/media/audio/1234567890-uuid.webm",
  "timestamp": "2026-04-16T10:00:00.000Z",
  "aiProcessed": false,
  ...
}
```

---

### `POST /api/entries/image`
Upload an image. AI processes asynchronously.

**Body (form-data):**
```
Field: file  (image file: jpg, png, webp, etc.)
```

**Response `201`:**
```json
{
  "id": "uuid",
  "type": "image",
  "fileUrl": "/media/images/1234567890-uuid.jpg",
  "thumbnailUrl": "/media/thumbnails/thumb-1234567890-uuid.jpg",
  "timestamp": "2026-04-16T10:00:00.000Z",
  "aiProcessed": false,
  ...
}
```

---

### `POST /api/entries/video`
Upload a video.

**Body (form-data):**
```
Field: file  (video file: mp4, webm, etc.)
```

**Response `201`:**
```json
{
  "id": "uuid",
  "type": "video",
  "fileUrl": "/media/videos/1234567890-uuid.mp4",
  "thumbnailUrl": "/media/thumbnails/thumb-uuid.jpg",
  "durationSec": 120.5,
  "timestamp": "2026-04-16T10:00:00.000Z",
  "aiProcessed": false,
  ...
}
```

---

### `POST /api/entries/document`
Upload a document (PDF, DOCX, TXT). AI processes asynchronously.

**Body (form-data):**
```
Field: file  (document file: pdf, docx, txt, md)
```

**Response `201`:**
```json
{
  "id": "uuid",
  "type": "document",
  "title": "meeting-notes.pdf",
  "fileUrl": "/media/documents/1234567890-uuid.pdf",
  "timestamp": "2026-04-16T10:00:00.000Z",
  "aiProcessed": false,
  ...
}
```

---

### `DELETE /api/entries/:id`
Delete an entry and its files.

**Response:**
```json
{ "status": "deleted" }
```

---

### `POST /api/entries/:id/reanalyze`
Re-run AI processing on an entry.

**Response:**
```json
{ "status": "reanalyzing" }
```

---

## Search

### `POST /api/search`
Semantic search using natural language.

**Body:**
```json
{
  "query": "when was I feeling stressed",
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
| `type` | `all` \| `text` \| `audio` \| `image` \| `video` \| `document` | `all` | Filter by entry type |

**Response:**
```json
{
  "query": "when was I feeling stressed",
  "count": 5,
  "results": [
    {
      "id": "uuid",
      "type": "text",
      "content": "Today was really stressful at work...",
      "summary": "User reflects on a stressful day at work",
      "mood": "stressed",
      "tags": ["work", "stress", "difficult"],
      "score": 0.847,
      "timestamp": "2026-04-15T10:00:00.000Z",
      ...
    }
  ]
}
```

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
{ "models": ["whisper", "llava", "llava:13b", "nomic-embed-text"] }
```

---

## Entry Schema

```typescript
type EntryType = 'text' | 'audio' | 'image' | 'video' | 'document';

interface Entry {
  id: string;                    // UUID
  type: EntryType;
  title: string | null;          // AI-generated
  content: string | null;        // AI-processed text
  originalFile: string | null;  // Original filename
  filePath: string | null;       // Server file path
  fileUrl: string | null;        // Public URL
  thumbnailUrl: string | null;   // For image/video
  summary: string | null;       // AI-generated summary
  mood: string | null;          // AI-detected mood
  tags: string[];               // AI-generated tags
  sourceText: string | null;    // Original text (audio transcript, etc.)
  timestamp: string;             // ISO-8601
  aiProcessed: boolean;
  fileSize: number | null;       // bytes
  durationSec: number | null;    // for audio/video
  mimeType: string | null;
  metadata: Record<string, unknown> | null;
}
```