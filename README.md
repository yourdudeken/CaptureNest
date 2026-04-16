<div align="center">

# CaptureNest

### AI-powered self-hosted multimedia journal

**Journal → AI Process → Search — your personal memory system**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](docker-compose.yml)
[![Ollama](https://img.shields.io/badge/AI-Ollama-ff6b35)](https://ollama.com)
[![Qdrant](https://img.shields.io/badge/Vector_DB-Qdrant-red)](https://qdrant.tech)

</div>

---

## What is CaptureNest?

CaptureNest is a **self-hosted AI-powered multimedia journal**. Capture your thoughts via text, voice, images, videos, or documents — AI extracts meaning, summarizes, detects mood, and tags everything. Search your memories using natural language.

```
"When was I feeling stressed?"
"Find entries about my trip to Tokyo"
"Show me happy moments from last week"
```

---

## Features

| Feature | Description |
|---|---|
| Text Journaling | Write entries, AI enriches with title, summary, mood, tags |
| Voice Notes | Record audio → Whisper transcription → AI structuring |
| Image Journal | Upload photos → AI describes and organizes |
| Video Notes | Upload videos → AI summarizes content |
| Document Import | PDF/DOCX/TXT → extract and summarize |
| Semantic Search | "When did I feel happy?" — vector search powered by Qdrant |
| Mood Tracking | AI detects mood, visualize emotion trends over time |
| Self-Hosted | Runs entirely locally — no cloud, no subscriptions |
| Docker Deploy | Full stack with one command |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Web Dashboard (React)                  │
│   Dashboard │ Journal │ Timeline │ Search │ Settings    │
└─────────────────────┬────────────────────────────────────┘
                       │ HTTP (Vite proxy / nginx)
┌─────────────────────▼────────────────────────────────────┐
│              CaptureNest API (Fastify/TypeScript)        │
│                                                          │
│  ┌─────────────┐ ┌────────────┐ ┌────────────────────┐   │
│  │ Entry Svc   │ │ File Svc   │ │  AI Pipeline       │   │
│  │ (CRUD)      │ │ (sharp)    │ │  Ollama → Qdrant   │   │
│  └─────────────┘ └────────────┘ └────────────────────┘   │
│                                                          │
│  ┌──────────────────────────┐  ┌─────────────────────┐  │
│  │   SQLite (entries)       │  │  Local Filesystem   │  │
│  └──────────────────────────┘  └─────────────────────┘  │
└──────────────────────────────────────────────────────────┘
          │                                      │
┌────────▼────────┐                   ┌─────────▼──────────┐
│  Ollama Server │                   │  Qdrant Vector DB  │
│  (whisper,     │                   │  (semantic search) │
│   llava, embed)│                   └─────────────────────┘
└─────────────────┘
```

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/yourdudeken/CaptureNest.git
cd CaptureNest
```

### 2. Start everything

```bash
docker compose up --build
```

### 3. Pull AI models

In a separate terminal (first-time setup only):

```bash
# Speech-to-text
docker exec -it capturenest-ollama-1 ollama pull whisper

# Vision model for image analysis
docker exec -it capturenest-ollama-1 ollama pull llava

# Embedding model for semantic search
docker exec -it capturenest-ollama-1 ollama pull nomic-embed-text
```

### 4. Open the dashboard

Navigate to **http://localhost:3000**

---

## Local Development

### Requirements

- Node.js 20+
- FFmpeg installed and in PATH
- A running Ollama instance (`ollama serve`)
- A running Qdrant instance (or use Docker: `docker run -p 6333:6333 qdrant/qdrant`)

### Setup

```bash
# Install all dependencies
npm install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env as needed

# Start both servers with hot reload
npm run dev
```

- **API**: http://localhost:4000
- **Web**: http://localhost:3000

---

## Project Structure

```
CaptureNest/
├── server/                    # Backend (Node.js + TypeScript + Fastify)
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── types.ts           # Shared type definitions
│   │   ├── db/
│   │   │   └── database.ts    # SQLite init + schema migrations
│   │   ├── api/routes/
│   │   │   ├── entryRoutes.ts     # Journal entry CRUD
│   │   │   ├── searchRoutes.ts    # AI search
│   │   │   ├── cameraRoutes.ts    # Camera management (legacy)
│   │   │   └── settingsRoutes.ts  # App settings + health
│   │   └── services/
│   │       ├── ai/
│   │       │   ├── ollamaService.ts     # Whisper, LLaVA, embeddings
│   │       │   ├── qdrantService.ts     # Vector storage/search
│   │       │   └── analysisPipeline.ts  # Entry processing
│   │       ├── media/
│   │       │   ├── entryService.ts      # Entry storage + DB
│   │       │   └── ffmpegService.ts     # Video handling
│   │       └── settings/
│   │           └── settingsService.ts   # Config key-value store
│   ├── Dockerfile
│   └── package.json
│
├── client/                       # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx               # Router
│   │   ├── lib/api.ts            # Typed API client
│   │   ├── components/
│   │   │   └── Layout.tsx        # Sidebar layout
│   │   └── pages/
│   │       ├── Dashboard.tsx     # Stats + recent entries
│   │       ├── Journal.tsx       # Create/view entries
│   │       ├── Timeline.tsx      # Entry timeline
│   │       ├── Search.tsx        # Natural language search
│   │       └── Settings.tsx      # Configuration
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml            # Full deployment stack
├── LICENSE                       # MIT
└── README.md
```

---

## Configuration

All settings can be changed in the **Settings** page of the dashboard, or via environment variables:

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://ollama:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llava` | Vision model for image analysis |
| `EMBED_MODEL` | `nomic-embed-text` | Embedding model for search |
| `WHISPER_MODEL` | `whisper` | Speech-to-text model |
| `QDRANT_URL` | `http://qdrant:6333` | Qdrant server URL |
| `MEDIA_PATH` | `./media` | Where to store files |
| `DB_PATH` | `./capturenest.db` | SQLite database path |
| `PORT` | `4000` | API server port |

---

## API Reference

See [docs/API.md](docs/API.md) for full endpoint documentation.

Quick overview:

```
POST /api/entries/text       – Create text entry (AI processes immediately)
POST /api/entries/audio      – Upload audio recording
POST /api/entries/image      – Upload image
POST /api/entries/video     – Upload video
POST /api/entries/document   – Upload document (PDF, DOCX, TXT)
GET  /api/entries           – List entries (filter by type, tag)
GET  /api/entries/:id       – Get single entry
DELETE /api/entries/:id     – Delete entry
POST /api/entries/:id/reanalyze
POST /api/search            – Natural language search
GET  /api/settings/health   – Service health check
```

---

## AI Models

CaptureNest uses [Ollama](https://ollama.com) to run AI models locally:

| Model | Purpose | Pull command |
|---|---|---|
| `whisper` | Speech-to-text transcription | `ollama pull whisper` |
| `llava` | Image understanding, captioning | `ollama pull llava` |
| `llava:13b` | Higher quality image analysis | `ollama pull llava:13b` |
| `nomic-embed-text` | Text embeddings for search | `ollama pull nomic-embed-text` |

---

## Docker Services

| Service | Port | Description |
|---|---|---|
| `capturenest-client` | 3000 | React dashboard |
| `capturenest-api` | 4000 | Fastify API server |
| `ollama` | 11434 | AI model inference |
| `qdrant` | 6333 | Vector database |

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.