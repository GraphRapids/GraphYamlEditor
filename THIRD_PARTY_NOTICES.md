# Third-Party Notices

Last verified: 2026-02-25

GraphYamlEditor is licensed under Apache-2.0. This file documents third-party software and tools used by the project.

## Runtime dependencies

| Component | How GraphYamlEditor uses it | License | Source |
| --- | --- | --- | --- |
| `react` | Component runtime | MIT | https://github.com/facebook/react |
| `react-dom` | Browser and test rendering | MIT | https://github.com/facebook/react |
| `@monaco-editor/react` | Monaco editor integration | MIT | https://github.com/suren-atoyan/monaco-react |
| `monaco-editor` | Editor implementation dependency | MIT | https://github.com/microsoft/monaco-editor |

## Build and development tooling (not redistributed)

| Component | How GraphYamlEditor uses it | License | Source |
| --- | --- | --- | --- |
| `@graphrapids/graph-autocomplete-core` | Storybook/e2e autocomplete harness logic | Apache-2.0 | https://github.com/GraphRapids/GraphAutocompleteCore |
| `esbuild` | Bundling package output to `dist/` | MIT | https://github.com/evanw/esbuild |
| `vitest` | Unit test runner | MIT | https://github.com/vitest-dev/vitest |
| `@testing-library/react` | React component tests | MIT | https://github.com/testing-library/react-testing-library |
| `@testing-library/jest-dom` | DOM assertions for tests | MIT | https://github.com/testing-library/jest-dom |
| `jsdom` | Browser-like DOM in Node test runtime | MIT | https://github.com/jsdom/jsdom |
| Node.js / npm | JavaScript runtime and package management | Mixed (Node.js project licensing) | https://nodejs.org/ |

## Downstream obligations

- Verify transitive dependency license obligations before redistribution.
- Keep this file updated when dependencies or tooling change.

## Verification sources used for this update

- Local project files:
  - `package.json`
  - `README.md`
  - `scripts/build.mjs`
  - `src/components/GraphYamlEditor/GraphYamlEditor.jsx`
