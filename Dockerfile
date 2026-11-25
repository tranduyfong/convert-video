FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY frontend ./frontend
COPY server ./server
ARG BRAND_NAME=TubeGo
ARG SITE_URL=http://localhost:3000
RUN BRAND_NAME="$BRAND_NAME" SITE_URL="$SITE_URL" npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates ffmpeg python3-venv && rm -rf /var/lib/apt/lists/*
ARG YT_DLP_VERSION=2026.11.23
RUN python3 -m venv /opt/media && /opt/media/bin/pip install --no-cache-dir "yt-dlp[default]==${YT_DLP_VERSION}"
ENV PATH="/opt/media/bin:${PATH}" NODE_ENV=production HOST=0.0.0.0 TEMP_ROOT=/app/tmp
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/frontend/out ./frontend/out
RUN mkdir /app/tmp && chown node:node /app/tmp
USER node
EXPOSE 3000
CMD ["node","dist/main.js"]
