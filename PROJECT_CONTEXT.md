# GraphYamlEditor - Project Context

## Purpose
GraphYamlEditor is a reusable React + Monaco component package for graph YAML authoring with schema-aware, scenario-driven autocomplete behavior.

## Primary Goals
- Keep Monaco lifecycle stable and performant.
- Provide deterministic autocomplete behavior from the behavior template.
- Surface syntax/schema diagnostics clearly in-editor.
- Remain reusable across GraphRapids applications.

## Package Snapshot
- Package name: `@graphrapids/graph-yaml-editor`
- Source: `src/components/GraphYamlEditor/GraphYamlEditor.jsx`
- Entry points:
  - `src/index.js`
  - `src/components/GraphYamlEditor/index.js`
- Build output:
  - `dist/index.js`
  - `dist/index.js.map`

## Consumer Contract
Main responsibilities:
- Render Monaco editor for YAML.
- Register completion/hover providers once and dispose cleanly.
- Trigger suggestions at expected flow points (including empty/root scenarios).
- Keep key and value suggestions aligned with schema + behavior rules.

## Behavior Contract Source
- `AUTOCOMPLETE_BEHAVIOR_TEMPLATE.md` in GraphEditor is the contract reference used for scenario alignment.

When behavior changes:
1. Update behavior scenarios/field policy.
2. Update tests.
3. Implement in `GraphYamlEditor.jsx` (or extracted autocomplete module when split out).

## Current Guardrails
- No value suggestions for free-text fields such as `name` and `label`.
- `type` fields receive domain/schema-driven value suggestions.
- Link endpoint suggestions (`from`/`to`) only use node names already defined in document.
- Root-level section suggestions are limited to missing sections.
- Spacing/indentation behavior is deterministic and context-aware.

## Monaco Lifecycle Rules
- Do not recreate editor/model on every render.
- Register providers once per Monaco instance and dispose on unmount.
- Avoid heavy parsing in per-keystroke handlers; use cached metadata.

## Testing Expectations
- Unit/integration: `npm run test`
- Build validation: `npm run build`
- Packaging: `npm pack`

## Integration Notes
GraphEditor consumes local tarball builds:
- `file:../GraphYamlEditor/graphrapids-graph-yaml-editor-0.1.0.tgz`

After GraphYamlEditor changes:
1. `npm run build`
2. `npm pack`
3. Reinstall in consumer app(s)

## Open Decisions / TODO
- [ ] Extract autocomplete engine from component file into dedicated module.
- [ ] Add scenario-row to test-case traceability table.
- [ ] Expand diagnostics mapping for domain validation locations.

## How To Maintain This File
- Update after any public API, behavior contract, or architecture changes.
- Keep it concise and implementation-accurate.
