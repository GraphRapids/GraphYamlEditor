import React from 'react';
import { useMemo, useRef, useState } from 'react';
import GraphYamlEditor from './GraphYamlEditor.jsx';
import {
  buildAutocompleteMetadata,
  buildAutocompleteRuntimeFromMeta,
  buildCompletionDocumentation,
  collectRootSectionPresence,
  computeIndentBackspaceDeleteCount,
  createEmptyCompletionMetaCache,
  DEFAULT_AUTOCOMPLETE_SPEC,
  getYamlAutocompleteContext,
  getYamlAutocompleteSuggestions,
  INDENT_SIZE,
  inferYamlSection,
  isRootBoundaryEmptyLine,
  lineIndent,
  LINK_TYPE_SUGGESTIONS,
  markerFromDiagnostic,
  NODE_TYPE_SUGGESTIONS,
} from '@graphrapids/graph-autocomplete-core';

function GraphYamlEditorHarness({ initialValue = '', theme = 'light' }) {
  const [value, setValue] = useState(initialValue);
  const documentStateRef = useRef(null);
  const completionMetaCacheRef = useRef(createEmptyCompletionMetaCache());
  const emptyCompletionMetaCacheRef = useRef(createEmptyCompletionMetaCache());
  const nodeTypeSuggestionsRef = useRef(NODE_TYPE_SUGGESTIONS);
  const linkTypeSuggestionsRef = useRef(LINK_TYPE_SUGGESTIONS);
  const autocompleteSpecRef = useRef(DEFAULT_AUTOCOMPLETE_SPEC);

  const meta = useMemo(() => buildAutocompleteMetadata(value), [value]);
  documentStateRef.current = {
    text: value,
    parsedGraph: null,
    entities: meta.entities,
  };

  return (
    <div style={{ height: '78vh', minHeight: 460, border: '1px solid #d0d7de' }}>
      <GraphYamlEditor
        value={value}
        onChange={setValue}
        theme={theme}
        schemaError=""
        diagnostics={[]}
        documentStateRef={documentStateRef}
        completionMetaCacheRef={completionMetaCacheRef}
        emptyCompletionMetaCache={emptyCompletionMetaCacheRef.current}
        nodeTypeSuggestionsRef={nodeTypeSuggestionsRef}
        linkTypeSuggestionsRef={linkTypeSuggestionsRef}
        autocompleteSpecRef={autocompleteSpecRef}
        markerFromDiagnostic={markerFromDiagnostic}
        collectRootSectionPresence={collectRootSectionPresence}
        buildAutocompleteMetadata={buildAutocompleteMetadata}
        buildAutocompleteRuntimeFromMeta={buildAutocompleteRuntimeFromMeta}
        getYamlAutocompleteSuggestions={getYamlAutocompleteSuggestions}
        lineIndent={lineIndent}
        inferYamlSection={inferYamlSection}
        buildCompletionDocumentation={buildCompletionDocumentation}
        getYamlAutocompleteContext={getYamlAutocompleteContext}
        isRootBoundaryEmptyLine={isRootBoundaryEmptyLine}
        computeIndentBackspaceDeleteCount={computeIndentBackspaceDeleteCount}
        indentSize={INDENT_SIZE}
      />
    </div>
  );
}

const meta = {
  title: 'Components/GraphYamlEditor',
  tags: ['autodocs'],
  render: (args) => <GraphYamlEditorHarness {...args} />,
  args: {
    theme: 'light',
  },
  argTypes: {
    theme: {
      control: { type: 'radio' },
      options: ['light', 'dark'],
    },
  },
};

export default meta;

export const EmptyDocument = {
  args: {
    initialValue: '',
  },
};

export const AutocompleteHarness = {
  args: {
    initialValue: 'nodes:\n  - name: A\nlinks:\n  - from: A\n    to: A\n',
  },
};
