# Integration Tests

These tests run against a **live instance** of the GraphYamlEditor service.
They use the Node.js built-in test runner (`node:test`) and make HTTP
requests via the global `fetch` API (Node 20+).

## Prerequisites

The service must be running before you execute the tests.
The quickest way is via Docker Compose:

```bash
docker compose up --build --wait
```

## Running

```bash
npm run test:integration
```

Or directly:

```bash
node --test tests/integration/*.integration.mjs
```

## Configuration

| Variable      | Default                  | Description          |
| ------------- | ------------------------ | -------------------- |
| `SERVICE_URL` | `http://localhost:6080`  | Base URL of service  |

Example with a custom URL:

```bash
SERVICE_URL=http://localhost:9090 npm run test:integration
```

## Design Principles

- **HTTP-only**: tests never import application internals.
- **Self-contained**: no pre-seeded data or external state required.
- **Naming convention**: files use the `.integration.mjs` suffix so that
  vitest (which matches `*.{test,spec}.*`) never picks them up during
  `npm test`.
