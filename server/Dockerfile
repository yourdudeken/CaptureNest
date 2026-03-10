FROM node:20-alpine

# Install system dependencies for sharp, ffmpeg, and native addons
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    vips-dev \
    libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .
RUN npm run build

# Runtime user (non-root for security)
RUN addgroup -S capturenest && adduser -S capturenest -G capturenest
RUN chown -R capturenest:capturenest /app

USER capturenest

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
