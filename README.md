# GraphYamlEditor

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![CI](https://github.com/GraphRapids/GraphYamlEditor/actions/workflows/ci.yml/badge.svg)](https://github.com/GraphRapids/GraphYamlEditor/actions/workflows/ci.yml)
[![Tests](https://github.com/GraphRapids/GraphYamlEditor/actions/workflows/test.yml/badge.svg)](https://github.com/GraphRapids/GraphYamlEditor/actions/workflows/test.yml)
[![Secret Scan](https://github.com/GraphRapids/GraphYamlEditor/actions/workflows/gitleaks.yml/badge.svg)](https://github.com/GraphRapids/GraphYamlEditor/actions/workflows/gitleaks.yml)

Reusable React Monaco YAML editor component for graph authoring with context-aware autocomplete, diagnostics, and live authoring UX hooks.

## Package

- Name: `@graphrapids/graph-yaml-editor`
- Entry export: `dist/index.js`
- Module format: ESM

## Capabilities

- Stable Monaco model lifecycle (no editor/model recreation on rerenders)
- Completion + hover provider registration and disposal
- Monaco adapter for keyboard interaction flows (Tab/Enter/Backspace) planned by `@graphrapids/graph-autocomplete-core`
- Marker rendering support for schema/syntax diagnostics
- Root/missing-section suggest trigger behaviors used by GraphRapids apps
- Profile-driven catalog integration via GraphAPI (`/v1/autocomplete/catalog`)
- Non-blocking warning/fallback behavior when profile API is unavailable

## Repository Layout

```text
src/index.js                                      # package export
src/components/GraphYamlEditor/index.js           # component export
src/components/GraphYamlEditor/GraphYamlEditor.jsx
src/components/GraphYamlEditor/GraphYamlEditor.test.jsx
src/components/GraphYamlEditor/GraphYamlEditor.stories.jsx
src/test/setup.js                                 # test setup
e2e/autocomplete.behavior.spec.ts                 # playwright autocomplete behavior suite
playwright.config.ts                              # playwright configuration
scripts/build.mjs                                 # package build script
vitest.config.js                                  # test configuration
.storybook/                                       # storybook configuration
.github/workflows/                                # CI, tests, release, secret scan
```

## Development

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm run test
```

Run component behavior e2e tests:

```bash
npm run test:e2e
```

Run Storybook for isolated component development:

```bash
npm run storybook
```

Build package output:

```bash
npm run build
```

## Profile Catalog Integration

`GraphYamlEditor` can fetch runtime type catalogs from GraphAPI and cache by active profile:

- `profileId`
- `profileApiBaseUrl`
- `profileStage` (`published` by default)
- `profileVersion` and `profileChecksum` (cache invalidation hints)

No per-keystroke network calls are made; catalog fetch occurs on profile context changes.
`fetchProfileCatalog()` also supports direct `graphTypeId`/`graphTypeVersion` arguments when used outside the component hook.

New exports:

- `fetchProfileCatalog` (`src/profile/catalogClient.js`)
- `useProfileCatalog` (`src/profile/useProfileCatalog.js`)

Pack local tarball for sibling repository use:

```bash
npm pack
```

## Consume From GraphEditor

GraphEditor references the local tarball:

```json
"@graphrapids/graph-yaml-editor": "file:../GraphYamlEditor/graphrapids-graph-yaml-editor-0.1.0.tgz"
```

After changes in this repo:

1. `npm run build`
2. `npm pack`
3. In `GraphEditor`:

```bash
npm install @graphrapids/graph-yaml-editor@file:../GraphYamlEditor/graphrapids-graph-yaml-editor-0.1.0.tgz --force
```

Autocomplete harness behavior in Storybook/e2e is provided by `@graphrapids/graph-autocomplete-core`.

## Governance

- Contribution guide: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`
- Release process: `RELEASE.md`
- Third-party notices: `THIRD_PARTY_NOTICES.md`

## Acknowledgements

- [React](https://react.dev/) for the component runtime.
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) and [`@monaco-editor/react`](https://github.com/suren-atoyan/monaco-react) for the editor integration.
- The GraphRapids maintainers and contributors for shaping the authoring behavior contract used by this component.

## License

Apache License 2.0 (`LICENSE`).
