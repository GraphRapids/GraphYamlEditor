# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Multi-stage `Dockerfile` that builds Storybook and serves it from a minimal `node:20-alpine` image with no dev dependencies in the final stage.
- `docker-compose.yml` with a `healthcheck` block — `docker compose up --wait` gates on service readiness.
- `scripts/serve.mjs` — zero-dependency static file server with `GET /health` → `200 {"status":"ok"}`.
- `.dockerignore` to keep the Docker build context lean.
- Integration test scaffolding under `tests/integration/` using the Node.js built-in test runner (`node:test`).
  - `health.integration.mjs` — validates the health-check contract.
  - `storybook.integration.mjs` — smoke-tests Storybook serving and path-traversal protection.
- `npm run test:integration` script (uses `node --test`; does not interfere with `npm test`).
- `DOCKER.md` — documents Docker build/run commands, exposed port, health check, and integration test usage.
- `tests/integration/README.md` — documents how to run integration tests and configuration options.
- `docs/adr/ADR-001.md` — Architecture Decision Record codifying standardised Dockerfile, health-check, and integration test conventions for all GraphRapids services.
