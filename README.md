# CaptureNest

A modern, self-hosted photo and video capture application with a professional web interface. Built with React, Node.js, Express, PostgreSQL, and Docker.

## Features

- **Modern UI**: Dark/Light mode, Responsive Design, Toast Notifications.
- **Multi-User Authentication**: Secure registration (bcrypt, UUIDs), JWT Auth.
- **Photo Capture**: Browser-based camera, Aspect Ratio Selection, High Quality PNG.
- **Video Recording**: Audio + Video, Codec Auto-Detection, Large File Support.
- **Gallery Management**: Grid Layout, Search, Filters, Lightbox Viewer.
- **Settings & Dashboard**: Media stats and theme management.

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourdudeken/CaptureNest.git
   cd CaptureNest
   ```
2. **Install & Env Setup**:
   ```bash
   npm install
   cp .env.example .env
   ```
3. **Start Database & Apps**:
   ```bash
   docker-compose up -d db
   npm run dev
   ```
   Navigate to http://localhost:3000

### Production Deployment

```bash
docker-compose up --build -d
```
Access at http://localhost.

## API Documentation

See [docs/API.md](docs/API.md) for full endpoint specifications.

## Troubleshooting & Ports

- **Port 5433**: Local PostgeSQL docker port.
- **Camera Access**: Requires HTTPS or localhost, plus explicit browser permissions.

## Architecture & Repo Structure

- **apps/server/**: Node.js/Express backend 
- **apps/web/**: React frontend
- **docker-compose.yml**: Production deployment

## License

MIT License - see LICENSE file for details
