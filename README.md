<div align="center">

# CaptureNest

### AI-powered self-hosted camera and media capture server

**Capture → Analyze → Search — entirely on your own hardware**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](docker-compose.yml)
[![Ollama](https://img.shields.io/badge/AI-Ollama-ff6b35)](https://ollama.com)
[![Qdrant](https://img.shields.io/badge/Vector_DB-Qdrant-red)](https://qdrant.tech)

</div>

---

## What is CaptureNest?

CaptureNest is a **production-ready, self-hosted** AI media server. Point it at your webcam or RTSP camera, capture photos and videos, and let a local AI model automatically describe and tag your media. Then search everything using natural language — no cloud, no subscriptions, no data leaving your machine.

```
"Show me when someone was at the front door"
"Find images with laptops"
"Show outdoor scenes from today"
```

---

## Features

| Feature | Description |
|---|---|
| Live Camera | Browser-based live preview, photo capture, and video recording |
| AI Analysis | Vision model (LLaVA) auto-generates descriptions and tags |
| Semantic Search | Natural language queries powered by vector embeddings + Qdrant |
| Media Library | Browse, filter, and manage your captures in a responsive grid |
| RTSP Support | Connect IP cameras and NVR/DVR systems via RTSP streams |
| Self-Hosted | Runs entirely locally — no cloud required |
| One-Command Deploy | Full Docker Compose setup |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Web Dashboard (React)                  │
│   Dashboard │ Camera │ Library │ AI Search │ Settings    │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP (Vite proxy / nginx)
┌─────────────────────▼────────────────────────────────────┐
│              CaptureNest API (Fastify/TypeScript)        │
│                                                          │
│  ┌─────────────┐ ┌────────────┐ ┌────────────────────┐   │
│  │  Camera Svc │ │ Media Svc  │ │  AI Pipeline       │   │
│  │  (FFmpeg)   │ │  (sharp)   │ │  Ollama → Qdrant   │   │
│  └─────────────┘ └────────────┘ └────────────────────┘   │
│                                                          │
│  ┌──────────────────────────┐  ┌─────────────────────┐   │
│  │   SQLite (metadata)      │  │  Local Filesystem   │   │
│  └──────────────────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────────┘
         │                                      │
┌────────▼────────┐                   ┌─────────▼──────────┐
│  Ollama Server  │                   │  Qdrant Vector DB  │
│  (LLaVA model)  │                   │  (semantic search) │
└─────────────────┘                   └────────────────────┘
```

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A webcam or RTSP camera (optional for initial setup)

### 1. Clone the repository

```bash
git clone https://github.com/yourdudeken/CaptureNest.git
cd CaptureNest
```

### 2. Start everything

```bash
docker compose up --build
```

### 3. Pull the AI vision model

In a separate terminal (first-time setup only):

```bash
# Pull vision model for image analysis
docker exec -it capturenest-ollama-1 ollama pull llava

# Pull embedding model for semantic search
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
│   │   │   ├── captureRoutes.ts   # Photo/video capture
│   │   │   ├── mediaRoutes.ts     # Media CRUD
│   │   │   ├── searchRoutes.ts    # AI search
│   │   │   ├── cameraRoutes.ts    # Camera management
│   │   │   └── settingsRoutes.ts  # App settings + health
│   │   └── services/
│   │       ├── ai/
│   │       │   ├── ollamaService.ts     # Vision model + embeddings
│   │       │   ├── qdrantService.ts     # Vector storage/search
│   │       │   └── analysisPipeline.ts  # Orchestration pipeline
│   │       ├── media/
│   │       │   ├── mediaService.ts     # File storage + DB
│   │       │   └── ffmpegService.ts    # Video recording
│   │       ├── camera/
│   │       │   └── cameraService.ts    # Camera config CRUD
│   │       └── settings/
│   │           └── settingsService.ts  # Config key-value store
│   ├── Dockerfile
│   └── package.json
│
├── web/                       # Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Router
│   │   ├── lib/api.ts         # Typed API client
│   │   ├── components/
│   │   │   └── Layout.tsx     # Sidebar layout
│   │   └── pages/
│   │       ├── Dashboard.tsx  # Stats + recent captures
│   │       ├── Camera.tsx     # Live camera + capture
│   │       ├── Library.tsx    # Media grid browser
│   │       ├── MediaDetail.tsx # Full viewer + AI metadata
│   │       ├── Search.tsx     # Natural language search
│   │       └── Settings.tsx   # Configuration
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml         # Full deployment stack
├── LICENSE                    # MIT
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
| `QDRANT_URL` | `http://qdrant:6333` | Qdrant server URL |
| `MEDIA_PATH` | `./media` | Where to store captured files |
| `DB_PATH` | `./capturenest.db` | SQLite database path |
| `PORT` | `4000` | API server port |

---

## API Reference

See [docs/API.md](docs/API.md) for full endpoint documentation.

Quick overview:

```
POST /api/capture/image        – Capture still image
POST /api/capture/video/start  – Start video recording
POST /api/capture/video/stop   – Stop recording
GET  /api/media                – List media (paginated)
GET  /api/media/:id            – Get single media item
DELETE /api/media/:id          – Delete media
POST /api/media/:id/reanalyze  – Re-run AI analysis
POST /api/search               – Natural language search
GET  /api/settings/health      – Service health check
```

---

## AI Models

CaptureNest uses [Ollama](https://ollama.com) to run AI models locally:

| Model | Purpose | Pull command |
|---|---|---|
| `llava` | Image analysis, captioning, tagging | `ollama pull llava` |
| `llava:13b` | Higher quality analysis | `ollama pull llava:13b` |
| `nomic-embed-text` | Text embeddings for search | `ollama pull nomic-embed-text` |

---

## Docker Services

| Service | Port | Description |
|---|---|---|
| `capturenest-web` | 3000 | React dashboard |
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
