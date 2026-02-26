import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GraphYamlEditor from './GraphYamlEditor.jsx';

const state = vi.hoisted(() => ({
  registerCompletionProviderSpy: vi.fn(),
  registerHoverProviderSpy: vi.fn(),
  completionProviderDisposeSpy: vi.fn(),
  hoverProviderDisposeSpy: vi.fn(),
  keyDownDisposeSpy: vi.fn(),
  focusDisposeSpy: vi.fn(),
  contentDisposeSpy: vi.fn(),
  cursorDisposeSpy: vi.fn(),
  setModelMarkersSpy: vi.fn(),
  triggerSpy: vi.fn(),
  executeEditsSpy: vi.fn(),
  completionProvider: null,
  keyDownHandler: null,
  focusHandler: null,
  contentHandler: null,
  cursorHandler: null,
  modelValue: '',
  modelVersion: 1,
  position: { lineNumber: 1, column: 1 },
  selection: null,
}));

function createSelection(lineNumber, column) {
  return {
    isEmpty: () => true,
    getPosition: () => ({ lineNumber, column }),
    getStartPosition: () => ({ lineNumber, column }),
  };
}

vi.mock('@monaco-editor/react', async () => {
  const React = await import('react');

  return {
    default: ({ value, onChange, onMount }) => {
      React.useEffect(() => {
        const fakeMonaco = {
          KeyCode: {
            Backspace: 1,
            Tab: 2,
            Enter: 3,
          },
          Range: class {
            constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
              this.startLineNumber = startLineNumber;
              this.startColumn = startColumn;
              this.endLineNumber = endLineNumber;
              this.endColumn = endColumn;
            }
          },
          MarkerSeverity: {
            Error: 8,
            Warning: 4,
            Info: 2,
          },
          editor: {
            setModelMarkers: (...args) => state.setModelMarkersSpy(...args),
          },
          languages: {
            CompletionItemKind: {
              Value: 1,
              Property: 2,
              Enum: 13,
            },
            CompletionItemInsertTextRule: {
              InsertAsSnippet: 4,
            },
            registerCompletionItemProvider: (language, provider) => {
              state.registerCompletionProviderSpy(language);
              state.completionProvider = provider;
              return { dispose: state.completionProviderDisposeSpy };
            },
            registerHoverProvider: (language, provider) => {
              state.registerHoverProviderSpy(language);
              return { dispose: state.hoverProviderDisposeSpy };
            },
          },
        };

        const model = {
          getValue: () => state.modelValue,
          getVersionId: () => state.modelVersion,
          getLineContent: (lineNumber) => state.modelValue.split('\n')[Math.max(0, lineNumber - 1)] || '',
          getLineCount: () => Math.max(1, state.modelValue.split('\n').length),
        };

        const fakeEditor = {
          getModel: () => model,
          onKeyDown: (handler) => {
            state.keyDownHandler = handler;
            return { dispose: state.keyDownDisposeSpy };
          },
          onDidFocusEditorText: (handler) => {
            state.focusHandler = handler;
            return { dispose: state.focusDisposeSpy };
          },
          onDidChangeModelContent: (handler) => {
            state.contentHandler = handler;
            return { dispose: state.contentDisposeSpy };
          },
          onDidChangeCursorPosition: (handler) => {
            state.cursorHandler = handler;
            return { dispose: state.cursorDisposeSpy };
          },
          getSelection: () => state.selection,
          getPosition: () => state.position,
          setPosition: (position) => {
            state.position = position;
            state.selection = createSelection(position.lineNumber, position.column);
          },
          focus: () => {},
          executeEdits: (...args) => state.executeEditsSpy(...args),
          trigger: (...args) => state.triggerSpy(...args),
        };

        onMount?.(fakeEditor, fakeMonaco);
      }, [onMount]);

      return (
        <textarea
          data-testid="monaco-editor"
          value={value}
          onChange={(event) => {
            state.modelValue = event.target.value;
            onChange?.(event.target.value);
          }}
          aria-label="Monaco editor"
        />
      );
    },
  };
});

function createDefaultProps(overrides = {}) {
  const emptyCompletionMetaCache = {
    version: null,
    text: '',
    meta: {
      lines: [''],
      entities: { nodeNames: [], portsByNode: new Map() },
      rootSectionPresence: new Set(),
    },
  };

  return {
    value: '',
    onChange: vi.fn(),
    theme: 'light',
    schemaError: '',
    diagnostics: [],
    documentStateRef: { current: null },
    completionMetaCacheRef: {
      current: {
        version: null,
        text: '',
        meta: {
          lines: [''],
          entities: { nodeNames: [], portsByNode: new Map() },
          rootSectionPresence: new Set(),
        },
      },
    },
    emptyCompletionMetaCache,
    nodeTypeSuggestionsRef: { current: ['router'] },
    linkTypeSuggestionsRef: { current: ['directed'] },
    autocompleteSpecRef: {
      current: {
        node: { entryStartKey: 'name' },
        link: { entryStartKey: 'from' },
      },
    },
    markerFromDiagnostic: vi.fn(() => ({
      severity: 8,
      message: 'diagnostic',
      source: 'test',
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 2,
    })),
    collectRootSectionPresence: () => new Set(),
    buildAutocompleteMetadata: (text) => ({
      lines: text.split('\n'),
      entities: { nodeNames: [], portsByNode: new Map() },
      rootSectionPresence: new Set(),
    }),
    buildAutocompleteRuntimeFromMeta: () => ({
      context: { kind: 'none', section: 'root', prefix: '' },
      objectKeys: [],
      itemContextKeys: [],
      canContinueItemContext: false,
      entities: { nodeNames: [], portsByNode: new Map() },
    }),
    getYamlAutocompleteSuggestions: () => [],
    lineIndent: (line) => (String(line).match(/^(\s*)/)?.[1].length || 0),
    inferYamlSection: () => ({ section: 'nodes', sectionIndent: 0 }),
    buildCompletionDocumentation: () => '',
    getYamlAutocompleteContext: () => ({ kind: 'none', section: 'root', prefix: '' }),
    isRootBoundaryEmptyLine: () => false,
    computeIndentBackspaceDeleteCount: () => 0,
    indentSize: 2,
    profileId: '',
    profileApiBaseUrl: '',
    profileStage: 'published',
    profileVersion: null,
    profileChecksum: '',
    profileCatalogCacheRef: { current: new Map() },
    profileCatalogResolver: vi.fn(async () => ({
      schemaVersion: 'v1',
      profileId: 'default',
      profileVersion: 1,
      checksum: 'checksum',
      nodeTypes: ['router'],
      linkTypes: ['directed'],
    })),
    onProfileCatalogWarning: vi.fn(),
    ...overrides,
  };
}

describe('GraphYamlEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    state.completionProvider = null;
    state.keyDownHandler = null;
    state.focusHandler = null;
    state.contentHandler = null;
    state.cursorHandler = null;
    state.modelValue = '';
    state.modelVersion = 1;
    state.position = { lineNumber: 1, column: 1 };
    state.selection = createSelection(1, 1);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers providers/listeners and disposes everything on unmount', async () => {
    const props = createDefaultProps({ value: '' });

    const { unmount } = render(<GraphYamlEditor {...props} />);

    expect(state.registerCompletionProviderSpy).toHaveBeenCalledWith('yaml');
    expect(state.registerHoverProviderSpy).toHaveBeenCalledWith('yaml');
    expect(state.triggerSpy).toHaveBeenCalledWith('mount', 'hideSuggestWidget', {});

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    unmount();

    expect(state.completionProviderDisposeSpy).toHaveBeenCalled();
    expect(state.hoverProviderDisposeSpy).toHaveBeenCalled();
    expect(state.keyDownDisposeSpy).toHaveBeenCalled();
    expect(state.focusDisposeSpy).toHaveBeenCalled();
    expect(state.contentDisposeSpy).toHaveBeenCalled();
    expect(state.cursorDisposeSpy).toHaveBeenCalled();
  });

  it('triggers suggest on focus when document is empty', () => {
    const props = createDefaultProps({ value: '' });
    render(<GraphYamlEditor {...props} />);

    state.triggerSpy.mockClear();
    state.modelValue = '';
    state.focusHandler();

    expect(state.triggerSpy).toHaveBeenCalledWith('focus', 'hideSuggestWidget', {});
  });

  it('triggers suggest when document becomes empty via content change', async () => {
    const props = createDefaultProps({ value: 'nodes:\n  - name: A\n' });
    state.modelValue = props.value;
    render(<GraphYamlEditor {...props} />);

    state.triggerSpy.mockClear();
    state.modelValue = '';
    state.modelVersion += 1;
    state.contentHandler();

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    expect(state.triggerSpy).toHaveBeenCalledWith('empty', 'hideSuggestWidget', {});
  });

  it('triggers suggest on Tab key press', async () => {
    const props = createDefaultProps({ value: 'nodes:\n  - name: A\n' });
    state.modelValue = props.value;
    render(<GraphYamlEditor {...props} />);

    state.triggerSpy.mockClear();
    state.keyDownHandler({ keyCode: 2 });

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    expect(state.triggerSpy).toHaveBeenCalledWith('keyboard', 'hideSuggestWidget', {});
  });

  it('applies indentation-aware backspace edit and opens next suggestions', async () => {
    const props = createDefaultProps({
      value: 'nodes:\n  - name: A\n    ',
      computeIndentBackspaceDeleteCount: () => 2,
    });
    state.modelValue = props.value;
    state.selection = createSelection(3, 5);
    state.position = { lineNumber: 3, column: 5 };

    render(<GraphYamlEditor {...props} />);

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    state.keyDownHandler({ keyCode: 1, preventDefault, stopPropagation });

    expect(preventDefault).toHaveBeenCalled();
    expect(state.executeEditsSpy).toHaveBeenCalledWith(
      'indent-backspace',
      expect.arrayContaining([
        expect.objectContaining({
          text: '',
        }),
      ])
    );

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    expect(state.triggerSpy).toHaveBeenCalledWith('backspace', 'hideSuggestWidget', {});
  });

  it('builds nested nodes insertion for node key context', () => {
    const props = createDefaultProps({
      value: 'nodes:\n  - name: subgraph1\n    no',
      buildAutocompleteRuntimeFromMeta: () => ({
        context: { kind: 'key', section: 'nodes', prefix: 'no' },
        objectKeys: [],
        itemContextKeys: [],
        canContinueItemContext: false,
        entities: { nodeNames: [], portsByNode: new Map() },
      }),
      getYamlAutocompleteSuggestions: () => ['nodes'],
    });
    state.modelValue = props.value;
    render(<GraphYamlEditor {...props} />);

    const model = {
      getValue: () => props.value,
      getVersionId: () => 99,
      getLineContent: () => '    no',
    };

    const result = state.completionProvider.provideCompletionItems(model, {
      lineNumber: 3,
      column: 7,
    });

    const suggestion = result.suggestions.find((item) => item.label === 'nodes');
    expect(suggestion).toBeTruthy();
    expect(suggestion.insertText).toBe('nodes:\n  - name: ');
  });

  it('builds nested nodes insertion for item-key continuation context', () => {
    const props = createDefaultProps({
      value: 'nodes:\n  - name: node-1\n    no',
      buildAutocompleteRuntimeFromMeta: () => ({
        context: { kind: 'itemKey', section: 'nodes', prefix: 'no' },
        objectKeys: [],
        itemContextKeys: ['name'],
        canContinueItemContext: true,
        entities: { nodeNames: ['node-1'], portsByNode: new Map() },
      }),
      getYamlAutocompleteSuggestions: () => ['  nodes'],
    });
    state.modelValue = props.value;
    render(<GraphYamlEditor {...props} />);

    const model = {
      getValue: () => props.value,
      getVersionId: () => 100,
      getLineContent: () => '    no',
    };

    const result = state.completionProvider.provideCompletionItems(model, {
      lineNumber: 3,
      column: 7,
    });

    const suggestion = result.suggestions.find((item) => item.label === '  nodes');
    expect(suggestion).toBeTruthy();
    expect(suggestion.insertText).toBe('    nodes:\n      - name: ');
  });

  it('inserts type values as snippets and triggers next-step suggestions', () => {
    const props = createDefaultProps({
      value: 'nodes:\n  - name: A\n    type: ro',
      buildAutocompleteRuntimeFromMeta: () => ({
        context: { kind: 'nodeTypeValue', section: 'nodes', prefix: 'ro' },
        objectKeys: [],
        itemContextKeys: [],
        canContinueItemContext: false,
        entities: { nodeNames: [], portsByNode: new Map() },
      }),
      getYamlAutocompleteSuggestions: () => ['router'],
    });
    state.modelValue = props.value;
    render(<GraphYamlEditor {...props} />);

    const model = {
      getValue: () => props.value,
      getVersionId: () => 42,
      getLineContent: () => '    type: ro',
    };

    const result = state.completionProvider.provideCompletionItems(model, {
      lineNumber: 3,
      column: 13,
    });

    const suggestion = result.suggestions.find((item) => item.label === 'router');
    expect(suggestion).toBeTruthy();
    expect(suggestion.insertText).toBe('router\n$0');
    expect(suggestion.insertTextRules).toBe(4);
    expect(suggestion.command).toEqual({
      id: 'editor.action.triggerSuggest',
      title: 'Trigger Next Step Suggestions',
    });
  });

  it('loads and caches profile catalogs when profile id changes', async () => {
    const resolver = vi
      .fn()
      .mockResolvedValueOnce({
        schemaVersion: 'v1',
        profileId: 'alpha',
        profileVersion: 1,
        checksum: 'alpha-1',
        nodeTypes: ['router'],
        linkTypes: ['directed'],
      })
      .mockResolvedValueOnce({
        schemaVersion: 'v1',
        profileId: 'beta',
        profileVersion: 1,
        checksum: 'beta-1',
        nodeTypes: ['gateway'],
        linkTypes: ['association'],
      });
    const cacheRef = { current: new Map() };
    const nodeTypeSuggestionsRef = { current: [] };
    const linkTypeSuggestionsRef = { current: [] };

    const props = createDefaultProps({
      profileId: 'alpha',
      profileCatalogResolver: resolver,
      profileCatalogCacheRef: cacheRef,
      nodeTypeSuggestionsRef,
      linkTypeSuggestionsRef,
    });

    const view = render(<GraphYamlEditor {...props} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(nodeTypeSuggestionsRef.current).toEqual(['router']);
    expect(linkTypeSuggestionsRef.current).toEqual(['directed']);

    view.rerender(<GraphYamlEditor {...props} profileId="beta" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(resolver).toHaveBeenCalledTimes(2);
    expect(nodeTypeSuggestionsRef.current).toEqual(['gateway']);

    view.rerender(<GraphYamlEditor {...props} profileId="alpha" />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(resolver).toHaveBeenCalledTimes(2);
    expect(nodeTypeSuggestionsRef.current).toEqual(['router']);
  });

  it('shows a non-blocking warning when catalog loading fails', async () => {
    const resolver = vi.fn(async () => {
      throw new Error('network down');
    });
    const onProfileCatalogWarning = vi.fn();
    const nodeTypeSuggestionsRef = { current: ['router'] };
    const linkTypeSuggestionsRef = { current: ['directed'] };
    const props = createDefaultProps({
      profileId: 'broken',
      profileCatalogResolver: resolver,
      onProfileCatalogWarning,
      nodeTypeSuggestionsRef,
      linkTypeSuggestionsRef,
    });

    const view = render(<GraphYamlEditor {...props} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(view.getByTestId('profile-catalog-warning').textContent).toContain('broken');
    expect(onProfileCatalogWarning).toHaveBeenLastCalledWith(expect.stringContaining('broken'));
    expect(nodeTypeSuggestionsRef.current).toEqual(['router']);
    expect(linkTypeSuggestionsRef.current).toEqual(['directed']);
  });
});
