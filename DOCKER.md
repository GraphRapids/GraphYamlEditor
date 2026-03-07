# Docker & Integration Tests

This document describes how to build and run GraphYamlEditor in a Docker
container and how to execute integration tests against the running service.

## Architecture

GraphYamlEditor is a React component library, not a standalone backend
service. For integration testing purposes, the Docker image builds
[Storybook](https://storybook.js.org/) and serves the static output via a
lightweight Node.js server (`scripts/serve.mjs`). The server also exposes a
`GET /health` endpoint used by Docker health checks and Graphras
orchestration.

## Exposed Port

| Port   | Protocol | Purpose                              |
| ------ | -------- | ------------------------------------ |
| `6080` | HTTP     | Storybook UI + `/health` endpoint    |

The port is configurable via the `PORT` environment variable.

## Building the Docker Image

```bash
docker build -t graph-yaml-editor .
```

## Running the Container

```bash
docker run -p 6080:6080 graph-yaml-editor
```

Or with Docker Compose (recommended — waits for health check):

```bash
docker compose up --build --wait
```

## Health Check

```bash
curl http://localhost:6080/health
# {"status":"ok"}
```

The Dockerfile and `docker-compose.yml` both include a `HEALTHCHECK` /
`healthcheck` block so that `docker compose up --wait` gates on readiness.

## Integration Tests

With the service running:

```bash
npm run test:integration
```

See [`tests/integration/README.md`](tests/integration/README.md) for
configuration options and design principles.

## Dockerfile Details

The Dockerfile uses a **multi-stage build**:

1. **build** stage — installs all dependencies (including devDependencies),
   runs `npm run build-storybook`, produces `storybook-static/`.
2. **production** stage — copies only the built static output and the
   zero-dependency `serve.mjs` script into a clean `node:20-alpine` image.
   No `node_modules`, source code, or dev tooling is present.

No secrets, credentials, or API keys are baked into the image. All
configuration is injected via environment variables at runtime.
