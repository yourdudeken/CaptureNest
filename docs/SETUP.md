# CaptureNest Development Setup

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

This will install dependencies for the root project and all workspaces (server and web).

### 2. Set Up Local Database

You have two options:

#### Option A: Use Docker for Database Only
```bash
# Start only the PostgreSQL database
docker-compose up db -d

# The database will be available at localhost:5432
```

#### Option B: Use Local PostgreSQL
Make sure PostgreSQL is installed and running, then create the database:
```bash
# Create database
createdb CaptureNest

# Run schema
psql -d CaptureNest -f apps/server/db/schema.sql
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (optional, defaults work for local dev):
```env
# Server
PORT=5000
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=CaptureNest
STORAGE_TYPE=local
LOCAL_MEDIA_PATH=./media
JWT_SECRET=55f2b35553327ef6fa0a4518bcda0065795d5595d8d4f91ad4d6d52ef7ae16ab

# Frontend (handled by proxy)
REACT_APP_API_URL=
```

### 4. Start Development Servers
```bash
npm run dev
```

This will start:
- **Backend** on http://localhost:5000 (blue logs)
- **Frontend** on http://localhost:3000 (green logs)

The frontend will automatically proxy API requests to the backend.

## Development Workflow

### Running the App
```bash
# Start both servers
npm run dev

# Start only backend
npm run dev --workspace=server

# Start only frontend
npm run dev --workspace=web
```

### Building for Production
```bash
# Build frontend
npm run build

# Or
npm run build --workspace=web
```

### Project Structure
```
CaptureNest/
├── apps/
│   ├── server/          # Backend (Express + PostgreSQL)
│   │   ├── db/
│   │   ├── routes/
│   │   ├── models/
│   │   └── server.js
│   └── web/             # Frontend (React)
│       ├── public/
│       └── src/
├── package.json         # Root workspace config
└── docker-compose.yml   # For production deployment
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login

### Media Upload
- `POST /api/upload/file` - Upload photo/video (requires auth)

### Gallery
- `GET /api/gallery?userId=<id>` - Get user's media
- `DELETE /api/gallery/:id` - Delete media (requires auth)

## Ports

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Database**: localhost:5432 (if using Docker)

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps db

# Or for local PostgreSQL
sudo systemctl status postgresql
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules apps/*/node_modules
npm install
```

### CORS Issues
The frontend proxy is configured to forward all `/api/*` requests to `http://localhost:5000`.
Make sure both servers are running.

## Testing the Connection

1. Start the dev servers: `npm run dev`
2. Open http://localhost:3000
3. Create an account
4. Try capturing a photo
5. Check the gallery

You should see logs in both the frontend (green) and backend (blue) terminals.

## Production Deployment

For production, use Docker:
```bash
docker-compose up --build
```

This will:
- Build optimized frontend
- Start backend server
- Initialize database automatically
- Serve on port 80
