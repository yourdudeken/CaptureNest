# CaptureNest 

A modern, self-hosted photo and video capture application with a professional web interface. Built with React, Node.js, Express, PostgreSQL, and Docker.

## Features

### Modern UI
- **Dark/Light Mode**: Seamless theme switching with localStorage persistence
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Professional Design**: Glassmorphism effects, smooth gradients, and fluid animations
- **Toast Notifications**: Non-intrusive feedback system for user actions
- **Hamburger Menu**: Mobile-friendly navigation with click-outside handlers

###  Multi-User Authentication
- **Secure Registration**: bcrypt password hashing with UUID-based user IDs
- **JWT Authentication**: Token-based login with 15-minute expiry
- **Session Management**: Automatic redirect on token expiration
- **User Profile Menu**: Quick access to settings and logout

###  Photo Capture
- **Browser-Based Camera**: Direct camera access via MediaDevices API
- **Camera Controls**: Flip between front/back cameras on mobile devices
- **Aspect Ratio Selection**: 3:4, 9:16, 1:1, 16:9, 4:3, and Full screen modes
- **High Quality**: PNG format with original camera resolution
- **Real-time Upload**: Progress tracking with visual feedback

###  Video Recording
- **Audio + Video**: Records both video and audio tracks
- **Codec Auto-Detection**: Automatically selects best supported codec
  - VP9 + Opus (best quality, Chrome/Firefox)
  - VP8 + Opus (good quality, wide support)
  - H264 + Opus (fallback)
  - WebM/MP4 (browser default)
- **Upload Progress**: Real-time progress bar during upload
- **Large File Support**: Up to 200MB per video

###  Gallery Management
- **Grid Layout**: Responsive 1-4 column layout based on screen size
- **Search**: Filter media by filename
- **Type Filters**: View all, photos only, or videos only
- **Lightbox Viewer**: Full-screen media viewing experience
- **Download**: Download any photo or video
- **Delete**: Remove media with confirmation dialog
- **Lazy Loading**: Efficient image loading

###  Settings & Dashboard
- **Dashboard**: Media statistics and recent uploads preview
- **Theme Toggle**: Switch between light and dark modes
- **Account Info**: View username and account details
- **Secure Logout**: Clear session and redirect to login

##  Architecture

### Technology Stack
- **Frontend**: React 18, React Router 7
- **Backend**: Node.js 18, Express
- **Database**: PostgreSQL 15 with UUID primary keys
- **Storage**: Local filesystem with Docker volume support
- **Web Server**: Nginx (production) with reverse proxy
- **Authentication**: JWT tokens with bcrypt password hashing
- **Upload**: Multer with FormData and XMLHttpRequest
- **Camera**: MediaDevices API
- **Recording**: MediaRecorder API with codec fallback

### Project Structure
```
CaptureNest/
├── apps/
│   ├── server/                      # Backend (Port 5000)
│   │   ├── server.js               # Express server
│   │   ├── routes/
│   │   │   ├── auth.js             # Authentication (register/login)
│   │   │   ├── uploads.js          # Media upload with sanitization
│   │   │   └── gallery.js          # Gallery CRUD operations
│   │   ├── storage/
│   │   │   └── adapter.js          # Storage abstraction (local/S3)
│   │   ├── db/
│   │   │   └── schema.sql          # PostgreSQL schema with UUIDs
│   │   ├── media/                  # Uploaded files (local dev)
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── web/                        # Frontend (Port 3000 dev, 80 prod)
│       ├── src/
│       │   ├── App.jsx             # Main app with routing
│       │   ├── index.js            # Entry point
│       │   ├── pages/              # Route components
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Gallery.jsx
│       │   │   ├── Capture.jsx
│       │   │   ├── Settings.jsx
│       │   │   ├── Auth.jsx
│       │   │   └── QRLogin.jsx
│       │   ├── components/         # Shared components
│       │   │   └── Lightbox.jsx
│       │   ├── context/            # Global state
│       │   │   ├── ThemeContext.jsx
│       │   │   └── ToastContext.jsx
│       │   └── styles/             # Global styles
│       │       ├── App.css
│       │       └── QRCode.css
│       ├── nginx.conf              # Nginx configuration
│       ├── package.json            # Includes proxy config
│       └── Dockerfile              # Multi-stage build
│
├── docker-compose.yml              # Production deployment
├── package.json                    # Monorepo workspace config
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

##  Getting Started

### Prerequisites
- **Node.js** 18 or higher
- **Docker** and **Docker Compose**
- **npm** or **yarn**

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourdudeken/CaptureNest.git
   cd CaptureNest
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional):
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work for local dev)
   ```

4. **Start the database**:
   ```bash
   docker-compose up -d db
   ```
   
   The database will be available at `localhost:5433` (port 5433 to avoid conflicts with local PostgreSQL).

5. **Start development servers**:
   ```bash
   npm run dev
   ```
   
   This starts:
   - **Backend** on http://localhost:5000
   - **Frontend** on http://localhost:3000

6. **Open the app**:
   Navigate to http://localhost:3000

### Production Deployment

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker logs -f CaptureNest-web-1
docker logs -f CaptureNest-server-1

# Stop all services
docker-compose down
```

**Access the application:**
- **Production**: http://localhost
- **Backend API**: http://localhost:5000 (direct) or http://localhost/api (via nginx)
- **Database**: localhost:5433 (external access)

##  Usage Guide

### Create Account
1. Open http://localhost (or http://localhost:3000 for dev)
2. Click **"Sign up"**
3. Enter username and password
4. Click **"Create Account"**
5. You'll be automatically logged in

### Capture Photos
1. Navigate to **"Capture"** page
2. Select aspect ratio (3:4, 9:16, 1:1, 16:9, 4:3, or Full)
3. Click **"Start Camera"**
4. Grant camera permission when prompted
5. Click **" Take Picture"**
6. Photo uploads automatically
7. View in **Gallery**

### Record Videos
1. Navigate to **"Capture"** page
2. Select aspect ratio
3. Click **"Start Camera"**
4. Grant camera and microphone permissions
5. Click **" Start Recording"**
6. Speak or make noise
7. Click **" Stop Recording"**
8. Video uploads automatically with audio
9. View and play in **Gallery**

### Manage Gallery
- **Search**: Type in search box to filter by filename
- **Filter**: Click "Photos" or "Videos" to filter by type
- **View**: Click any media to open in lightbox
- **Download**: Hover and click download button
- **Delete**: Hover and click delete button (with confirmation)
- **Navigate**: Use arrow keys or swipe in lightbox

##  Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000

# Database Configuration (Local Development)
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=CaptureNest
PGPORT=5433

# Database Configuration (Docker Production)
# PGHOST=db
# PGPORT=5432

# Storage Configuration
STORAGE_TYPE=local
LOCAL_MEDIA_PATH=./media

# S3 Storage (Optional)
# STORAGE_TYPE=s3
# S3_BUCKET=your-bucket
# S3_ACCESS_KEY=your-key
# S3_SECRET_KEY=your-secret
# S3_ENDPOINT=https://s3.amazonaws.com
# S3_REGION=us-east-1

# Authentication & Security
# Generate with: openssl rand -hex 32
JWT_SECRET=55f2b35553327ef6fa0a4518bcda0065795d5595d8d4f91ad4d6d52ef7ae16ab
REFRESH_SECRET=a8f3c9e2b1d4f7a6e5c8b9d2f3e4a7b6c9d8e7f6a5b4c3d2e1f9a8b7c6d5e4f3
JWT_EXPIRY=15m
REFRESH_EXPIRY=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Upload Limits
MAX_FILE_SIZE=209715200  # 200MB in bytes

# Node Environment
NODE_ENV=development
```

### Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with UUID
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Media table with UUID reference
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  content_type VARCHAR(100),
  storage_type VARCHAR(50),
  s3_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

##  API Endpoints

### Authentication
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}

Response: {
  "token": "jwt-token",
  "refresh": "refresh-token",
  "user": { "id": "uuid", "username": "user" }
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user",
  "password": "password"
}

Response: {
  "token": "jwt-token",
  "refresh": "refresh-token",
  "user": { "id": "uuid", "username": "user" }
}
```

### Media Upload
```http
POST /api/upload/file
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData: { media: File }

Response: {
  "id": "uuid",
  "filename": "timestamp-uuid-filename.ext"
}
```

### Gallery
```http
GET /api/gallery?userId=<uuid>

Response: [
  {
    "id": "uuid",
    "filename": "...",
    "url": "/media/...",
    "content_type": "image/png",
    "created_at": "2025-11-19T..."
  }
]
```

```http
DELETE /api/gallery/:id
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Media deleted successfully"
}
```

##  Features in Detail

### Aspect Ratio Controls

The app provides professional camera-style aspect ratio selection:

- **Portrait Modes**:
  - 3:4 - Standard portrait photos
  - 9:16 - Instagram Stories/Reels format
  - 1:1 - Square format (Instagram posts)

- **Landscape Modes**:
  - 16:9 - Widescreen (YouTube, modern displays)
  - 4:3 - Classic TV format

- **Full Screen**: No aspect ratio constraint

Aspect ratio controls appear as an overlay on the video feed when the camera is active, with a professional glassmorphism design.

### Video Recording Codec Support

The app automatically detects and uses the best supported codec:

1. **VP9 + Opus** (best quality, Chrome/Firefox)
2. **VP8 + Opus** (good quality, wide support)
3. **H264 + Opus** (fallback)
4. **WebM** (generic fallback)
5. **MP4** (Safari/iOS)
6. **Browser default** (last resort)

### Responsive Breakpoints

- **Desktop** (>1024px): Full navigation, 3-4 column gallery
- **Tablet** (768px-1024px): Compact layout, 2-3 column gallery
- **Mobile** (<768px): Hamburger menu, 1-2 column gallery

### Dark Mode

- Toggle via header button (/) or Settings page
- Persists across sessions in localStorage
- Smooth transitions between themes
- All components support both themes

##  Troubleshooting

### Port Conflicts

If port 5432 is already in use by local PostgreSQL:
- The app uses port **5433** for Docker PostgreSQL
- Update `PGPORT` in `.env` if needed

### Camera/Microphone Permissions

If camera or microphone doesn't work:
1. Check browser permissions (usually in address bar)
2. Use **HTTPS** in production (required for camera API)
3. Grant permissions when prompted
4. Check system settings for camera/microphone access

### Video Recording Issues

**"Failed to start recording":**
- Refresh the page
- Check browser console for codec info
- Try different browser (Chrome/Firefox recommended)
- Ensure microphone permission is granted

**No audio in video:**
- Grant microphone permission
- Check system microphone settings
- Verify microphone is not muted
- Test microphone in system settings

### Upload Failures

**401 Unauthorized:**
- **Cause**: Security token has expired (default is 15 minutes) or server secret changed.
- **Fix**: Log out completely and sign in again.
- **Dev Tip**: Increase `JWT_EXPIRY` in `.env` to `24h` for longer sessions.
- Clear browser cache and cookies


**413 Request Entity Too Large:**
- File exceeds 200MB limit
- Nginx `client_max_body_size` is configured to 200M
- Check video length and quality settings

**404 Not Found (for uploaded media):**
- Refresh the browser (hard refresh: Ctrl+Shift+R)
- Clear browser cache
- Check that files exist: `docker exec CaptureNest-server-1 ls -lh /media/`
- Restart server: `docker-compose restart server`

### Database Connection Issues

```bash
# Check database status
docker-compose ps db

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Connect to database
docker exec -it CaptureNest-db-1 psql -U postgres -d CaptureNest
```

### File System Issues

```bash
# Check media directory
docker exec CaptureNest-server-1 ls -lh /media/

# Check volume
docker volume inspect CaptureNest_media

# Create media directory if missing
docker exec CaptureNest-server-1 mkdir -p /media
docker exec CaptureNest-server-1 chmod 755 /media
```

##  Security Features

- **Password Hashing**: bcrypt with automatic salt generation
- **UUID Primary Keys**: Non-sequential, non-guessable user IDs
- **JWT Authentication**: Secure token-based auth with expiry
- **Authorization**: Token verification on protected routes
- **User Isolation**: Users can only access their own media
- **CORS**: Configured for allowed origins only
- **Input Validation**: Server-side validation and sanitization
- **Filename Sanitization**: Removes trailing spaces and special characters
- **File Size Limits**: 200MB max upload
- **SQL Injection Protection**: Parameterized queries via Knex

##  Performance

### Optimizations
- **Lazy Loading**: Images load as needed
- **Efficient React Hooks**: useCallback for stable references
- **Optimized CSS**: CSS variables and minimal re-renders
- **Progress Tracking**: Real-time upload feedback
- **Nginx Caching**: Static assets cached for 1 year
- **Gzip Compression**: Enabled for text-based assets

### File Sizes
- **Photos**: ~100KB - 5MB (depends on camera resolution)
- **Videos**: ~1MB - 200MB (depends on length and quality)
- **Frontend Bundle**: ~500KB (production build, gzipped)

##  Development

### Adding Dependencies

**Frontend:**
```bash
npm install <package> --workspace=web
```

**Backend:**
```bash
npm install <package> --workspace=server
```

### Running Tests

```bash
# Frontend tests
npm test --workspace=web

# Backend tests
npm test --workspace=server
```

### Building for Production

```bash
# Build frontend only
npm run build --workspace=web

# Build and deploy with Docker
docker-compose up --build -d
```

### Database Management

```bash
# Access database
docker exec -it CaptureNest-db-1 psql -U postgres -d CaptureNest

# Run SQL commands
\dt                    # List tables
\d users              # Describe users table
SELECT * FROM users;  # Query users

# Backup database
docker exec CaptureNest-db-1 pg_dump -U postgres CaptureNest > backup.sql

# Restore database
docker exec -i CaptureNest-db-1 psql -U postgres CaptureNest < backup.sql
```

##  License

MIT License - see LICENSE file for details

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

##  Support

For issues and questions, please open an issue on GitHub.

##  Learning Outcomes

This project demonstrates:
- Full-stack React + Node.js development
- JWT authentication implementation
- MediaDevices and MediaRecorder APIs
- Responsive CSS design with dark mode
- Docker containerization and multi-stage builds
- PostgreSQL database design with UUIDs
- File upload handling with progress tracking
- Real-time progress tracking with XMLHttpRequest
- Theme management with Context API
- Monorepo architecture with npm workspaces
- Nginx reverse proxy configuration
- Production deployment with Docker Compose

---

**Made with love using React, Node.js, Express, PostgreSQL, and Docker**
