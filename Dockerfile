# ── Stage 1: Build the API server (TypeScript) ──
FROM node:20-alpine AS api-build
WORKDIR /app
COPY package*.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN npm ci

COPY server/ ./server/
COPY tsconfig.json ./
RUN npm run build --workspace=server

# ── Stage 2: Build the Web dashboard (Vite/React) ──
FROM node:20-alpine AS web-build
WORKDIR /app
COPY package*.json ./
COPY server/package.json ./server/
COPY web/package.json ./web/
RUN npm ci

COPY web/ ./web/
COPY tsconfig.json ./
RUN npm run build --workspace=web

# ── Stage 3: Production Image (Combined) ──
# We use a base Node 20 image (with FFmpeg) to run the Fastify API.
# The React static files are bundled inside the API container and served by Fastify.
FROM node:20-alpine
WORKDIR /app

# Install FFmpeg (required for video/RTSP recording)
RUN apk add --no-cache ffmpeg

# Copy production dependencies configuration
COPY package*.json ./
COPY server/package.json ./server/
RUN npm ci --omit=dev --workspace=server

# Copy compiled API code
COPY --from=api-build /app/server/dist ./server/dist

# Copy compiled Web dashboard into the API's public serving directory
COPY --from=web-build /app/web/dist ./server/dist/public

# Setup shared environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

EXPOSE 4000
CMD ["npm", "start", "--workspace=server"]
