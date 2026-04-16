# CaptureNest Complete Setup Guide

This guide covers the full setup procedures for deploying CaptureNest. We strongly recommend using Docker Compose for self-hosted environments.

## Prerequisites

Before deploying the application, ensure your host system has the following installed:

1. **Docker Engine**: Version 24 or newer.
2. **Docker Compose**: Version v2.20 or newer.
3. **Hardware Requirements**:
   - Minimum: 4GB RAM, 2 CPU Cores.
   - Recommended: 8GB+ RAM, 4+ CPU Cores (for local AI analysis).
   - Local LLM execution requires sufficient memory or a compatible GPU for acceptable inference times.
4. **Network**: Port 3000 (web) must be available. 11434 (Ollama) and 6333 (Qdrant) are used internally but can be exposed if needed.

## Deployment Method 1: Pre-built Docker Image (Recommended)

The fastest way to deploy CaptureNest is by pulling the continuously integrated Docker image from Docker Hub. You do not need to clone the repository for this method.

### 1. Create a Directory

Create an empty directory on your host server to store the configuration and persistent data volumes.

```bash
mkdir capturenest
cd capturenest
```

### 2. Create the Docker Compose File

Create a file named `docker-compose.yml` inside the directory:

```bash
touch docker-compose.yml
```

Open `docker-compose.yml` in your preferred text editor and paste the following configuration:

```yaml
# ════════════════════════════════════════════════════════════════
#  CaptureNest — Docker Compose Production
#  Run with:  docker compose up -d
#  Dashboard: http://localhost:4000
# ════════════════════════════════════════════════════════════════

services:

  # ── CaptureNest API + Frontend ──────────────────────────────────
  capturenest:
    image: yourdudeken/capturenest:latest
    ports:
      - "4000:4000"
    environment:
      PORT:            "4000"
      HOST:            "0.0.0.0"
      NODE_ENV:        "production"
      DB_PATH:         "/data/capturenest.db"
      MEDIA_PATH:      "/media"
      OLLAMA_URL:      "http://ollama:11434"
      OLLAMA_MODEL:    "llava"
      WHISPER_MODEL:   "whisper"
      EMBED_MODEL:     "nomic-embed-text"
      EMBED_DIMENSIONS: "768"
      QDRANT_URL:      "http://qdrant:6333"
      CORS_ORIGIN:     "http://localhost:3000"
      LOG_LEVEL:       "info"
    volumes:
      - media:/media
      - dbdata:/data
    depends_on:
      - qdrant
    networks:
      - capturenest-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4000/health"]
      interval: 30s
      timeout:  10s
      retries:  3
      start_period: 15s

  # ── Ollama (local AI / LLM inference) ──────────────────────────
  ollama:
    image: ollama/ollama:0.1.33
    ports:
      - "11434:11434"
    volumes:
      - ollama:/root/.ollama
    networks:
      - capturenest-net
    restart: unless-stopped
    # To use GPU acceleration instead, uncomment these lines:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: 1
    #           capabilities: [gpu]

  # ── Qdrant (vector database for semantic search) ───────────────
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"   # gRPC
    volumes:
      - qdrant:/qdrant/storage
    networks:
      - capturenest-net
    restart: unless-stopped


# ── Named volumes ──────────────────────────────────────────────────
volumes:
  media:
  dbdata:
  ollama:
  qdrant:

# ── Internal network ───────────────────────────────────────────────
networks:
  capturenest-net:
    driver: bridge
```

### 3. Deploy

Run the following command to download the images from Docker Hub and start the system:

```bash
docker compose up -d
```

---

## Deployment Method 2: Build from Source

If you plan to modify CaptureNest or want to build the Docker image locally from source files, follow these steps.

### 1. Clone the Repository

Clone the project to your chosen installation directory on your host machine.

```bash
git clone https://github.com/yourdudeken/CaptureNest.git
cd CaptureNest
```

### 2. Configure Environment Variables (Optional)

The system is configured to work out-of-the-box using standard configurations. If you need to override directory paths or settings locally, you can modify the environment files. The inline environment bindings in the `docker-compose.yml` take precedence by default.

### 3. Build and Deploy

CaptureNest provides a multi-container Docker Compose file that automatically builds the unified Node.js API Backend + React Web Interface from your local source files.

Run the following command in the root project directory to build the image and start the cluster:

```bash
docker compose up --build -d
```

---

## Accessing the Platform

Once the server has fully initialized (this requires first pulling the Docker images online), access the dashboard through your web browser:

**Dashboard URL**: `http://localhost:3000`

If deploying to a headless server, replace `localhost` with the server's local IP address (e.g., `http://192.168.1.100:3000`).

## Post-Installation Steps

- **Logs Monitoring**: To monitor the backend server and troubleshoot initialization issues, run:
  ```bash
  docker logs -f capturenest-capturenest-1
  ```
- **AI Models**: Pull required models for the journal app:
  ```bash
  # Speech-to-text
  docker exec -it capturenest-ollama-1 ollama pull whisper
  
  # Vision for image analysis
  docker exec -it capturenest-ollama-1 ollama pull llava
  
  # Embeddings for semantic search
  docker exec -it capturenest-ollama-1 ollama pull nomic-embed-text
  ```
- **Hardware Acceleration**: If your host has an NVIDIA GPU configured with the container toolkit, uncomment the `deploy` rules under the `ollama` service block in `docker-compose.yml` to enable GPU acceleration before running compose up.

## Troubleshooting

- **Out of Memory**: If the container crashes during AI analysis or the search times out, ensure your host system has sufficient RAM to load the LLM into memory. Ensure Docker has adequate resource limits assigned.
- **Permission Errors**: Ensure the user running Docker has permissions to read/write to the volume directories mounted for media arrays.
- **Port Conflicts**: If port 4000 is occupied, you can map it to a different port by modifying the `ports:` definition (e.g., `"8080:4000"`) under the `capturenest` service in your `docker-compose.yml`.
