# ─── Builder Stage ───
FROM node:20-alpine AS builder

# Required for some native deps
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 1. Copy root and workspace definitions
COPY package*.json tsconfig.json ./
COPY server/package*.json server/
COPY web/package*.json web/

# 2. Clean install all workspaces
RUN npm ci

# 3. Copy source files
COPY server/ server/
COPY web/ web/

# 4. Build both frontend and backend
RUN npm run build --workspaces


# ─── Production Stage ───
FROM node:20-alpine

# FFmpeg is required for the application's video recording services
RUN apk add --no-cache ffmpeg

WORKDIR /app

# 1. Copy package files
COPY package*.json ./
COPY server/package*.json server/

# 2. Production install strictly for the server (the front end is static)
RUN npm ci --omit=dev --workspace=server

# 3. Copy compiled node backend logic
COPY --from=builder /app/server/dist ./server/dist

# 4. Copy the compiled Vite frontend application
COPY --from=builder /app/web/dist ./web/dist

# 5. Runtime environment variables
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0
ENV WEB_DIST_PATH=../web/dist

EXPOSE 4000

# Fire it up
CMD ["npm", "start"]
