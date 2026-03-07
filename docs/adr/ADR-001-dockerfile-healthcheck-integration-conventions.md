# ADR-001: Standardized Dockerfile, Health-Check, and Integration Test Conventions for GraphRapids Services

## Status

Accepted

## Context

GraphRapids is adopting pre-push integration validation via Graphras. Each service in the suite needs to be containerized and expose a health check so the orchestration agent can:

1. Build and start services via Docker.
2. Wait for readiness before running integration tests.
3. Run integration tests against live instances over HTTP.
4. Tear down services after validation.

Without a standardized convention, each repository would implement these artifacts differently, making orchestration unreliable and maintenance costly.

## Decision

### Dockerfile

- All services MUST use a **multi-stage Dockerfile** so that dev/build dependencies are not present in the final image.
- The final stage MUST be based on a minimal base image (e.g., `node:20-alpine`, `python:3.12-slim`).
- The Dockerfile MUST include an `EXPOSE` directive documenting the service port.
- The Dockerfile MUST include a `HEALTHCHECK` instruction that probes the `/health` endpoint.
- No secrets, credentials, or API keys may be hard-coded. All sensitive configuration MUST be injected via environment variables at runtime.

### Health Check Endpoint

- Every service MUST expose `GET /health` returning HTTP 200 with JSON body `{"status": "ok"}`.
- The Content-Type MUST be `application/json`.
- The endpoint MUST NOT require authentication.
- If the service has hard dependencies (e.g., a database), the health check SHOULD probe them and return a non-200 status if they are unavailable.

### docker-compose.yml

- Each repository MUST include a `docker-compose.yml` at the repo root.
- The service definition MUST include a `healthcheck` block matching the Dockerfile's health check.
- If the service has hard dependencies, those MUST be included as separate services with their own health checks.
- Port mappings MUST be consistent between the Dockerfile `EXPOSE` directive and docker-compose port mapping.

### Integration Tests

- Integration tests MUST live in a `tests/integration/` directory.
- They MUST operate purely over HTTP against a configurable base URL (environment variable `SERVICE_URL` with a sensible default).
- They MUST NOT import application internals or share process memory with the service under test.
- They MUST be fully self-contained: create their own test data, assert against it, and clean up afterwards.
- They MUST be runnable independently from unit tests via a dedicated script (e.g., `npm run test:integration`).
- The existing unit test command MUST continue to work unchanged.

### Port Allocation

- Each service should use a stable, documented port number.
- Port assignments for the suite:
  - GraphYamlEditor: **8080**
  - (Future services to be assigned sequentially to avoid conflicts.)

## Consequences

- All GraphRapids repositories follow a consistent containerization and testing pattern.
- Graphras can orchestrate pre-push integration validation using a uniform interface (`docker compose up --wait`, `npm run test:integration`, `GET /health`).
- New contributors can onboard quickly by following the same conventions across all repos.
- The multi-stage build convention keeps production images lean and secure.
- Port allocation is centralized in this ADR to prevent conflicts when composing multiple services.
