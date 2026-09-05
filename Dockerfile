# ─── Stage 1: Build React Frontend ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Prevent Puppeteer from downloading Chromium during build (saves 300MB & build time)
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy package files and install ALL deps (including devDeps needed for Vite build)
COPY package*.json ./
RUN npm ci

# Copy source and build production bundle
COPY . .
RUN npm run build

# ─── Stage 2: Production Server ───────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Prevent Puppeteer from downloading Chromium in production container
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend source files
COPY server.js ./
COPY server/ ./server/
COPY src/services/weatherApi.js ./src/services/weatherApi.js
COPY src/services/locationExtractor.js ./src/services/locationExtractor.js

# Copy VAPID keys if present (or will be provided via environment variables)
COPY vapid_keys.json* ./

# Copy built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Initialize persistent JSON stores if missing
RUN echo "[]" > manager_alerts.json && \
    echo "[]" > forecast_snapshots.json && \
    echo "[]" > accuracy_log.json && \
    echo "[]" > push_subscriptions.json

# Default port (Render will inject its own $PORT dynamically)
ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

# Start the Express server
CMD ["node", "server.js"]
