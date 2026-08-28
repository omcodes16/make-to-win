# ─── Stage 1: Build React Frontend ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (including devDeps needed for Vite build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ─── Stage 2: Production Server ───────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend source files
COPY server.js ./
COPY server/ ./server/
COPY src/services/weatherApi.js ./src/services/weatherApi.js

# Copy built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Copy any data files (alerts, snapshots) — will be created on first run if missing
RUN echo "[]" > manager_alerts.json && \
    echo "[]" > forecast_snapshots.json && \
    echo "[]" > accuracy_log.json

# Expose backend port
EXPOSE 3001

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the Express server
CMD ["node", "server.js"]
