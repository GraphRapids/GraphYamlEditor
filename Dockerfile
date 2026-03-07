# Stage 1: Install dependencies and build Storybook
FROM node:20-alpine AS build
RUN apk add --no-cache git
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build-storybook

# Stage 2: Production-like runtime serving built Storybook on port 8080
FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=build /app/storybook-static ./storybook-static
COPY scripts/serve.mjs ./scripts/serve.mjs
RUN chown -R appuser:appgroup /app
USER appuser

# Exposed port — also documented in README and docker-compose.yml
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "scripts/serve.mjs"]
