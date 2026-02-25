# GraphYamlEditor

Reusable Monaco-based YAML editor component for GraphRapids apps.

This repository contains the standalone `@graphrapids/graph-yaml-editor` package extracted from GraphEditor so it can be reused across web apps.

## What This Package Owns

- Monaco editor lifecycle (`@monaco-editor/react`) with a stable model
- Completion + hover provider registration/disposal
- Monaco marker updates from diagnostics
- Keyboard-driven editor behavior (Tab/Enter/Backspace flows)
- Suggest-widget trigger behavior (empty doc, root gaps, cursor/focus transitions)
- E2E helper bridge (`window.__graphEditorE2E`) used by GraphEditor tests

## What The Host App Owns

This package is intentionally UI/editor-focused. The host app provides domain logic through props:

- YAML parsing + schema validation
- autocomplete context/suggestion computation
- marker mapping helpers
- metadata caches and refs

## Repository Layout

```text
src/index.js                                      # package export
src/components/GraphYamlEditor/index.js           # component export
src/components/GraphYamlEditor/GraphYamlEditor.jsx
scripts/build.mjs                                 # esbuild bundle script
dist/index.js                                     # built package output (generated)
```

## Requirements

- Node.js `>=20`
- npm `>=10`

Peer dependencies (provided by consuming app):

- `react`
- `react-dom`
- `@monaco-editor/react`

## Install And Build

```bash
npm install
npm run build
```

Create a local tarball for sibling-repo consumption:

```bash
npm pack
```

This generates:

- `graphrapids-graph-yaml-editor-0.1.0.tgz`

## Using In GraphEditor

GraphEditor consumes this package from the tarball path:

```json
"@graphrapids/graph-yaml-editor": "file:../GraphYamlEditor/graphrapids-graph-yaml-editor-0.1.0.tgz"
```

After changes in this repo:

1. Run `npm run build`
2. Run `npm pack`
3. In `GraphEditor`, run:

```bash
npm install @graphrapids/graph-yaml-editor@file:../GraphYamlEditor/graphrapids-graph-yaml-editor-0.1.0.tgz --force
```

## Component API

Default export: `GraphYamlEditor`

Key prop groups:

- `value`, `onChange`, `theme`
- diagnostics: `schemaError`, `diagnostics`, `markerFromDiagnostic`
- cached document refs: `documentStateRef`, `completionMetaCacheRef`, `emptyCompletionMetaCache`
- autocomplete refs: `nodeTypeSuggestionsRef`, `linkTypeSuggestionsRef`, `autocompleteSpecRef`
- host logic callbacks:
  - `collectRootSectionPresence`
  - `buildAutocompleteMetadata`
  - `buildAutocompleteRuntimeFromMeta`
  - `getYamlAutocompleteSuggestions`
  - `getYamlAutocompleteContext`
  - `buildCompletionDocumentation`
  - `inferYamlSection`
  - `lineIndent`
  - `isRootBoundaryEmptyLine`
  - `computeIndentBackspaceDeleteCount`
- formatting: `indentSize`

## License

Apache-2.0 (see `LICENSE`).
