import React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GraphYamlEditor from './GraphYamlEditor.jsx';
import {
  buildAutocompleteMetadata,
  buildAutocompleteRuntimeFromMeta,
  buildCompletionDocumentation,
  collectRootSectionPresence,
  computeIndentBackspaceDeleteCount,
  createEmptyCompletionMetaCache,
  createProfileCatalog,
  DEFAULT_AUTOCOMPLETE_SPEC,
  getYamlAutocompleteContext,
  getYamlAutocompleteSuggestions,
  INDENT_SIZE,
  inferYamlSection,
  isRootBoundaryEmptyLine,
  lineIndent,
  markerFromDiagnostic,
} from '@graphrapids/graph-autocomplete-core';

function GraphYamlEditorHarness({ initialValue = '', theme = 'light' }) {
  const [value, setValue] = useState(initialValue);
  const documentStateRef = useRef(null);
  const completionMetaCacheRef = useRef(createEmptyCompletionMetaCache());
  const emptyCompletionMetaCacheRef = useRef(createEmptyCompletionMetaCache());
  const defaultCatalog = useMemo(
    () =>
      createProfileCatalog({
        profileId: 'storybook',
        profileVersion: 1,
        checksum: 'storybook',
        nodeTypes: ['router', 'switch', 'firewall'],
        linkTypes: ['directed', 'undirected', 'association'],
      }),
    []
  );
  const nodeTypeSuggestionsRef = useRef(defaultCatalog.nodeTypes);
  const linkTypeSuggestionsRef = useRef(defaultCatalog.linkTypes);
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

function GraphYamlEditorProfileCatalogHarness({ theme = 'light' }) {
  const [value, setValue] = useState('nodes:\n  - name: A\n    type: ');
  const [profileId, setProfileId] = useState('alpha');
  const [resolverMode, setResolverMode] = useState('ok');
  const [warning, setWarning] = useState('');
  const documentStateRef = useRef(null);
  const completionMetaCacheRef = useRef(createEmptyCompletionMetaCache());
  const emptyCompletionMetaCacheRef = useRef(createEmptyCompletionMetaCache());
  const nodeTypeSuggestionsRef = useRef(['router']);
  const linkTypeSuggestionsRef = useRef(['directed']);
  const autocompleteSpecRef = useRef(DEFAULT_AUTOCOMPLETE_SPEC);
  const profileCatalogCacheRef = useRef(new Map());

  const meta = useMemo(() => buildAutocompleteMetadata(value), [value]);
  documentStateRef.current = {
    text: value,
    parsedGraph: null,
    entities: meta.entities,
  };

  const profileCatalogResolver = useCallback(
    async ({ profileId }) => {
      if (resolverMode === 'fail') {
        throw new Error('simulated outage');
      }

      const profileCatalogs = {
        alpha: {
          schemaVersion: 'v1',
          profileId: 'alpha',
          profileVersion: 1,
          checksum: 'alpha-cs',
          nodeTypes: ['router', 'switch'],
          linkTypes: ['directed', 'undirected'],
        },
        beta: {
          schemaVersion: 'v1',
          profileId: 'beta',
          profileVersion: 2,
          checksum: 'beta-cs',
          nodeTypes: ['gateway', 'firewall'],
          linkTypes: ['association'],
        },
      };
      return profileCatalogs[profileId] || profileCatalogs.alpha;
    },
    [resolverMode]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.__GRAPH_EDITOR_E2E__) {
      return;
    }

    window.__graphProfileE2E = {
      setProfileId,
      setResolverMode,
      getWarning: () => warning,
      getActiveProfileId: () => profileId,
    };

    return () => {
      delete window.__graphProfileE2E;
    };
  }, [warning, profileId]);

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
        profileId={profileId}
        profileCatalogResolver={profileCatalogResolver}
        profileCatalogCacheRef={profileCatalogCacheRef}
        onProfileCatalogWarning={setWarning}
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

export const ProfileCatalogHarness = {
  render: (args) => <GraphYamlEditorProfileCatalogHarness {...args} />,
  args: {
    theme: 'light',
  },
};
