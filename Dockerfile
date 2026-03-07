# ---------------------------------------------------------------------------
# Stage 1 – build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

RUN apk add --no-cache git

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build-storybook

# ---------------------------------------------------------------------------
# Stage 2 – production-like runtime (no dev dependencies)
# ---------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Only the pre-built Storybook output and the zero-dependency server script
COPY --from=build /app/storybook-static ./storybook-static
COPY scripts/serve.mjs ./serve.mjs

# Exposed port – also used in docker-compose.yml and DOCKER.md
EXPOSE 6080

ENV PORT=6080
ENV STATIC_DIR=/app/storybook-static

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:6080/health || exit 1

CMD ["node", "serve.mjs"]
