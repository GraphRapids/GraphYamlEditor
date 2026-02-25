# Contributing

Thanks for contributing to GraphYamlEditor.

## Development Setup

```bash
npm install
```

Build package output:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## Project Structure

- `src/components/GraphYamlEditor/GraphYamlEditor.jsx`: reusable Monaco YAML editor component
- `src/components/GraphYamlEditor/GraphYamlEditor.test.jsx`: component behavior tests
- `src/index.js`: package export entrypoint
- `scripts/build.mjs`: package bundling via esbuild
- `.github/workflows/`: CI, tests, release, and secret scanning workflows

## Pull Requests

Before opening a PR:

1. Keep changes focused and atomic.
2. Add or update tests for behavior changes.
3. Update docs (`README.md`, `THIRD_PARTY_NOTICES.md`) when relevant.
4. Ensure workflows are green (`CI`, `Tests`, and `Secret Scan`).

## Commit Guidance

- Use clear, imperative commit messages.
- Prefer conventional prefixes (`feat`, `fix`, `docs`, `test`, `chore`).
- Reference issue numbers when applicable.
- Avoid bundling unrelated changes in one PR.

## Reporting Bugs and Requesting Features

Use GitHub issues for bug reports and feature requests.

For security issues, follow `SECURITY.md`.
