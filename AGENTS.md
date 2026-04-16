# Agent Instructions for CaptureNest

## Current Direction
This project is being refactored from a camera/media capture app to a **self-hosted AI-powered multimedia journal**. The goal is a personal memory system where users can journal using audio, video, pictures, and documents. Text is extracted and journaled using AI.

## Core Concepts
- **Entry** (not "Media"): The main data model - a journal entry that can contain text, audio, image, video, or document
- **AI Processing**: Any input gets processed into structured data: title, content, summary, mood, tags
- **Semantic Search**: "When was I stressed?" "Find entries about..." using Qdrant embeddings

## Dev Commands

```bash
npm run dev          # Start both server (4000) and client (3000) with hot reload
npm run build        # Build both server and client
cd server && npm run dev    # Server only
cd client && npm run dev    # Client only
```

## Prerequisites

- **FFmpeg** must be installed and in PATH (required for video/audio processing)
- **Ollama** must be running locally (`ollama serve`) with `llava`, `nomic-embed-text`, and `whisper` pulled
- **Qdrant** must be running locally on port 6333

## Setup

```bash
npm install
cp server/.env.example server/.env
# Pull required models:
# ollama pull llava
# ollama pull nomic-embed-text  
# ollama pull whisper
```

## Architecture

- **Monorepo**: npm workspaces with `server/` and `client/` directories
- **Server**: Fastify + TypeScript, uses `ts-node-dev` for hot reload
- **Client**: React + Vite + Tailwind
- **Database**: SQLite (better-sqlite3)
- **AI**: Ollama (whisper for speech-to-text, llava for vision, embeddings for search)
- **Storage**: Local filesystem (`server/media/`) - consider MinIO for document storage in production

## Key Files (Refactor Targets)

- `server/src/db/database.ts` - Schema needs migration to support `entries` table
- `server/src/types.ts` - Add `Entry` type with `type: 'text' | 'audio' | 'image' | 'video' | 'document'`
- `server/src/services/media/mediaService.ts` - Rename to `entryService`, add document/audio handling
- `server/src/services/ai/analysisPipeline.ts` - Add text entry + audio transcription pipelines

## API Changes (In Progress)

- `POST /api/entries/text` - Create text entry (no file, process text with AI)
- `POST /api/entries/audio` - Audio recording → Whisper → structured entry
- `POST /api/entries/document` - PDF/DOCX → extract text → summarize
- Replace `mediaRoutes` with `entryRoutes`

## Important

- Server env file is at `server/.env`, not root
- Media files stored in `server/media/` by default
- Default Ollama URL is `http://localhost:11434`, update .env if using Docker
- AI processing runs synchronously in request thread - consider BullMQ + Redis for production