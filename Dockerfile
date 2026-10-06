# syntax=docker/dockerfile:1
# Kathakaar — Node server + static web app.  Debian (glibc) base because onnxruntime-node has no musl/Alpine build.
FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000 \
    KATHAKAAR_DATA=/app/data

WORKDIR /app

# WITH_MODELS=1  installs @xenova/transformers (local neural embeddings, ~400 MB of packages) — same as `npm run setup-model`
# PRELOAD_MODEL  downloads that model while building so the first run works offline ("" = download on first use)
ARG WITH_MODELS=1
ARG PRELOAD_MODEL=Xenova/bge-base-en-v1.5

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev --no-audit --no-fund; else npm install --omit=dev --no-audit --no-fund; fi \
 && if [ "$WITH_MODELS" = "1" ]; then npm install @xenova/transformers@2.17.2 --no-save --no-audit --no-fund; fi \
 && npm cache clean --force

COPY server ./server
COPY public ./public

RUN mkdir -p /app/data /app/models \
 && if [ "$WITH_MODELS" = "1" ] && [ -n "$PRELOAD_MODEL" ]; then node server/preload.js "$PRELOAD_MODEL" || echo "Model preload skipped (no network at build time?) — it will download on first use."; fi \
 && chown -R node:node /app

USER node
VOLUME ["/app/data", "/app/models"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
