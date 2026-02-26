import React from 'react';
import { useEffect, useRef } from 'react';
import MonacoEditorReact from '@monaco-editor/react';
import {
  EMPTY_PROFILE_CATALOG,
  buildCompletionDocumentation,
  buildYamlSuggestionInsertText,
  planYamlBackspaceKeyAction,
  planYamlEnterKeyAction,
  resolveAutocompleteMetadataCache,
  resolveCompletionCommandBehavior,
  resolveYamlAutocompleteAtPosition,
} from '@graphrapids/graph-autocomplete-core';

import { fetchProfileCatalog } from '../../profile/catalogClient.js';
import { useProfileCatalog } from '../../profile/useProfileCatalog.js';

const Editor = MonacoEditorReact?.default || MonacoEditorReact;

const DEFAULT_EDITOR_OPTIONS = {
  minimap: { enabled: false },
  wordWrap: 'on',
  fontSize: 14,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordBasedSuggestions: 'off',
  snippetSuggestions: 'none',
  quickSuggestions: { comments: false, strings: true, other: true },
  suggestOnTriggerCharacters: true,
  suggest: {
    showWords: false,
    showSnippets: false,
  },
  tabCompletion: 'on',
};

const DEFAULT_EDITOR_SHELL_STYLE = {
  width: '100%',
  height: '100%',
  minHeight: 320,
};

export default function GraphYamlEditor({
  value,
  onChange,
  theme,
  schemaError,
  diagnostics,
  documentStateRef,
  completionMetaCacheRef,
  emptyCompletionMetaCache,
  nodeTypeSuggestionsRef,
  linkTypeSuggestionsRef,
  autocompleteSpecRef,
  markerFromDiagnostic,
  resolveAutocompleteMeta = resolveAutocompleteMetadataCache,
  resolveAutocompleteAtPosition = resolveYamlAutocompleteAtPosition,
  resolveCompletionCommand = resolveCompletionCommandBehavior,
  planEnterKeyAction = planYamlEnterKeyAction,
  planBackspaceKeyAction = planYamlBackspaceKeyAction,
  buildCompletionDocs = buildCompletionDocumentation,
  buildCompletionInsertText = buildYamlSuggestionInsertText,
  indentSize,
  profileId = '',
  profileApiBaseUrl = '',
  profileStage = 'published',
  profileVersion = null,
  profileChecksum = '',
  profileCatalogCacheRef = null,
  profileCatalogResolver = fetchProfileCatalog,
  onProfileCatalogWarning = null,
}) {
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const editorModelRef = useRef(null);
  const completionProviderRef = useRef(null);
  const hoverProviderRef = useRef(null);
  const tabSuggestListenerRef = useRef(null);
  const focusSuggestListenerRef = useRef(null);
  const modelContentListenerRef = useRef(null);
  const cursorSuggestListenerRef = useRef(null);
  const internalProfileCatalogCacheRef = useRef(new Map());
  const activeProfileCatalogRef = useRef(EMPTY_PROFILE_CATALOG);

  const profileCatalogCache = profileCatalogCacheRef || internalProfileCatalogCacheRef;
  const { catalog: resolvedProfileCatalog, warning: profileCatalogWarning } = useProfileCatalog({
    profileId,
    profileApiBaseUrl,
    profileStage,
    profileVersionHint: profileVersion,
    profileChecksumHint: profileChecksum,
    cacheRef: profileCatalogCache,
    resolver: profileCatalogResolver,
  });

  useEffect(() => {
    if (!resolvedProfileCatalog?.profileId) {
      return;
    }
    activeProfileCatalogRef.current = resolvedProfileCatalog;
    if (resolvedProfileCatalog.nodeTypes.length > 0) {
      nodeTypeSuggestionsRef.current = resolvedProfileCatalog.nodeTypes;
    }
    if (resolvedProfileCatalog.linkTypes.length > 0) {
      linkTypeSuggestionsRef.current = resolvedProfileCatalog.linkTypes;
    }
  }, [resolvedProfileCatalog, nodeTypeSuggestionsRef, linkTypeSuggestionsRef]);

  useEffect(() => {
    if (typeof onProfileCatalogWarning === 'function') {
      onProfileCatalogWarning(profileCatalogWarning);
    }
  }, [onProfileCatalogWarning, profileCatalogWarning]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.__graphEditorE2E) {
        delete window.__graphEditorE2E;
      }
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current || value.trim().length > 0) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      editorRef.current?.trigger('empty-model', 'editor.action.triggerSuggest', {});
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    const monaco = monacoRef.current;
    const model = editorModelRef.current;
    if (!monaco || !model || !monaco.editor?.setModelMarkers) {
      return;
    }

    const markerOwner = 'grapheditor';
    if (schemaError) {
      monaco.editor.setModelMarkers(model, markerOwner, [
        {
          severity: monaco.MarkerSeverity.Error,
          message: schemaError,
          source: 'schema',
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
        },
      ]);
      return;
    }

    const markers = (diagnostics || []).map((diagnostic) => markerFromDiagnostic(monaco, model, diagnostic));
    monaco.editor.setModelMarkers(model, markerOwner, markers);
  }, [schemaError, diagnostics, markerFromDiagnostic]);

  useEffect(() => {
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
      if (hoverProviderRef.current) {
        hoverProviderRef.current.dispose();
      }
      if (tabSuggestListenerRef.current) {
        tabSuggestListenerRef.current.dispose();
      }
      if (focusSuggestListenerRef.current) {
        focusSuggestListenerRef.current.dispose();
      }
      if (modelContentListenerRef.current) {
        modelContentListenerRef.current.dispose();
      }
      if (cursorSuggestListenerRef.current) {
        cursorSuggestListenerRef.current.dispose();
      }
      if (monacoRef.current?.editor?.setModelMarkers && editorModelRef.current) {
        monacoRef.current.editor.setModelMarkers(editorModelRef.current, 'grapheditor', []);
      }
    };
  }, []);

  function getCompletionMeta(model) {
    const text = model.getValue();
    const version = typeof model.getVersionId === 'function' ? model.getVersionId() : null;
    const { meta, cache } = resolveAutocompleteMeta({
      text,
      version,
      cache: completionMetaCacheRef.current,
      latestDocumentState: documentStateRef.current,
    });
    completionMetaCacheRef.current = cache;
    return meta;
  }

  function onEditorMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editorModelRef.current = editor.getModel?.() || null;

    if (typeof window !== 'undefined' && window.__GRAPH_EDITOR_E2E__) {
      window.__graphEditorE2E = {
        setValue(nextValue) {
          editor.getModel?.()?.setValue(String(nextValue ?? ''));
        },
        getValue() {
          return editor.getModel?.()?.getValue?.() || '';
        },
        setPosition(lineNumber, column) {
          editor.setPosition?.({ lineNumber, column });
          editor.focus?.();
        },
        getPosition() {
          return editor.getPosition?.() || null;
        },
        triggerSuggest() {
          editor.trigger('e2e', 'editor.action.triggerSuggest', {});
        },
        focus() {
          editor.focus?.();
        },
      };
    }

    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }
    if (hoverProviderRef.current) {
      hoverProviderRef.current.dispose();
    }
    if (tabSuggestListenerRef.current) {
      tabSuggestListenerRef.current.dispose();
    }
    if (focusSuggestListenerRef.current) {
      focusSuggestListenerRef.current.dispose();
    }
    if (modelContentListenerRef.current) {
      modelContentListenerRef.current.dispose();
    }
    if (cursorSuggestListenerRef.current) {
      cursorSuggestListenerRef.current.dispose();
    }

    function resolveSuggestionsForPosition(model, position) {
      if (!model || !position) {
        return { runtime: null, suggestions: [] };
      }
      const meta = getCompletionMeta(model);
      const text = model.getValue();
      return resolveAutocompleteAtPosition({
        text,
        lineNumber: position.lineNumber,
        column: position.column,
        meta,
        profileCatalog: activeProfileCatalogRef.current,
        nodeTypeSuggestions: nodeTypeSuggestionsRef.current,
        linkTypeSuggestions: linkTypeSuggestionsRef.current,
        spec: autocompleteSpecRef.current,
      });
    }

    function triggerSuggestIfAvailable(source) {
      const model = editor.getModel?.();
      const position =
        editor.getPosition?.() || editor.getSelection?.()?.getPosition?.() || editor.getSelection?.()?.getStartPosition?.();
      if (!model || !position) {
        editor.trigger(source, 'editor.action.triggerSuggest', {});
        return;
      }
      const { suggestions } = resolveSuggestionsForPosition(model, position);
      if (suggestions.length > 0) {
        editor.trigger(source, 'editor.action.triggerSuggest', {});
        return;
      }
      editor.trigger(source, 'hideSuggestWidget', {});
    }

    function triggerRootSuggestIfMissing(source) {
      const model = editor.getModel?.();
      const position =
        editor.getPosition?.() || editor.getSelection?.()?.getPosition?.() || editor.getSelection?.()?.getStartPosition?.();
      if (!model || !position) {
        return;
      }

      const text = model.getValue();
      if (!text.trim()) {
        return;
      }

      const { runtime, suggestions } = resolveSuggestionsForPosition(model, position);
      if (runtime.context.kind !== 'rootKey' && runtime.context.kind !== 'rootItemKey') {
        return;
      }

      if (suggestions.length > 0) {
        editor.trigger(source, 'editor.action.triggerSuggest', {});
        return;
      }

      editor.trigger(source, 'hideSuggestWidget', {});
    }

    completionProviderRef.current = monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: [' ', ':', '-', '.'],
      provideCompletionItems(model, position) {
        const meta = getCompletionMeta(model);
        const text = model.getValue();
        const { runtime, suggestions } = resolveAutocompleteAtPosition({
          text,
          lineNumber: position.lineNumber,
          column: position.column,
          meta,
          profileCatalog: activeProfileCatalogRef.current,
          nodeTypeSuggestions: nodeTypeSuggestionsRef.current,
          linkTypeSuggestions: linkTypeSuggestionsRef.current,
          spec: autocompleteSpecRef.current,
        });
        const context = runtime.context;

        const completionKinds = monaco.languages.CompletionItemKind || {};
        const insertTextRules = monaco.languages.CompletionItemInsertTextRule || {};
        const propertyKind = completionKinds.Property ?? 2;
        const valueKind = completionKinds.Value ?? 1;
        const enumKind = completionKinds.Enum ?? valueKind;

        const startColumn = Math.max(1, position.column - (context.prefix || '').length);
        const range = new monaco.Range(position.lineNumber, startColumn, position.lineNumber, position.column);

        const currentLine =
          typeof model.getLineContent === 'function' ? model.getLineContent(position.lineNumber) : '';

        const completionItems = suggestions.map((item, idx) => {
          let itemRange = range;
          let insertText;
          let insertTextRule;
          if (context.kind === 'rootItemKey' || context.kind === 'itemKey') {
            itemRange = new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column);
          } else if (context.kind === 'endpointValue' && item === ':') {
            itemRange = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);
          }

          const insertion = buildCompletionInsertText({
            context,
            suggestion: item,
            spec: autocompleteSpecRef.current,
            indentSize,
            lines: meta.lines,
            lineNumber: position.lineNumber,
            currentLine,
          });
          insertText = insertion.insertText;
          if (insertion.insertAsSnippet) {
            insertTextRule = insertTextRules.InsertAsSnippet;
          }

          const isValueContext =
            context.kind === 'nodeTypeValue' || context.kind === 'linkTypeValue' || context.kind === 'endpointValue';
          const completionBehavior = resolveCompletionCommand(context, item);
          const keyToken = completionBehavior.keyToken;

          return {
            label: item,
            kind: isValueContext ? enumKind : propertyKind,
            range: itemRange,
            insertText,
            insertTextRules: insertTextRule,
            sortText: `${String(idx).padStart(3, '0')}-${item}`,
            detail: context.kind === 'key' || context.kind === 'itemKey' || context.kind === 'rootKey' ? 'Next graph step' : 'Graph value',
            documentation: buildCompletionDocs(keyToken),
            command: completionBehavior.shouldTriggerSuggest
              ? {
                  id: 'editor.action.triggerSuggest',
                  title: completionBehavior.title,
                }
              : undefined,
          };
        });

        if (completionItems.length === 0) {
          return undefined;
        }
        return { suggestions: completionItems };
      },
    });

    if (typeof monaco.languages.registerHoverProvider === 'function') {
      hoverProviderRef.current = monaco.languages.registerHoverProvider('yaml', {
        provideHover(model, position) {
          const word = model.getWordAtPosition?.(position);
          if (!word?.word) {
            return null;
          }
          const key = word.word;
          const docs = buildCompletionDocs(key);
          if (!docs) {
            return null;
          }

          return {
            range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
            contents: [{ value: `**${key}**` }, { value: docs }],
          };
        },
      });
    }

    tabSuggestListenerRef.current = editor.onKeyDown((event) => {
      const isTabKey = event.keyCode === monaco.KeyCode.Tab || event.browserEvent?.key === 'Tab';
      if (isTabKey) {
        window.setTimeout(() => {
          triggerSuggestIfAvailable('keyboard');
        }, 0);
        return;
      }

      const isEnterKey =
        (monaco.KeyCode?.Enter && event.keyCode === monaco.KeyCode.Enter) || event.browserEvent?.key === 'Enter';
      if (isEnterKey) {
        const selection = editor.getSelection?.();
        const model = editor.getModel?.();
        const position =
          selection?.getPosition?.() || selection?.getStartPosition?.() || editor.getPosition?.();
        if (selection?.isEmpty?.() && model && position) {
          const enterAction = planEnterKeyAction({
            text: model.getValue(),
            lineNumber: position.lineNumber,
            column: position.column,
            indentSize,
          });
          if (enterAction.shouldHandle) {
            event.preventDefault?.();
            event.stopPropagation?.();
            editor.executeEdits?.(enterAction.editId, [
              {
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: enterAction.insertText,
              },
            ]);
            window.setTimeout(() => {
              triggerSuggestIfAvailable(enterAction.triggerSource);
            }, 0);
            return;
          }
        }
        window.setTimeout(() => {
          triggerSuggestIfAvailable('enter');
        }, 0);
        return;
      }

      const isBackspaceKey =
        event.keyCode === monaco.KeyCode.Backspace || event.browserEvent?.key === 'Backspace';
      if (!isBackspaceKey) {
        return;
      }

      const selection = editor.getSelection?.();
      if (!selection || !selection.isEmpty?.()) {
        return;
      }

      const model = editor.getModel?.();
      if (!model) {
        return;
      }

      const position = selection.getPosition?.();
      if (!position) {
        return;
      }

      const backspaceAction = planBackspaceKeyAction({
        text: model.getValue(),
        lineNumber: position.lineNumber,
        column: position.column,
        indentSize,
      });
      if (!backspaceAction.shouldHandle) {
        return;
      }

      event.preventDefault?.();
      event.stopPropagation?.();
      if (backspaceAction.deleteEndColumn > backspaceAction.deleteStartColumn) {
        editor.executeEdits?.(backspaceAction.editId, [
          {
            range: new monaco.Range(
              position.lineNumber,
              backspaceAction.deleteStartColumn,
              position.lineNumber,
              backspaceAction.deleteEndColumn
            ),
            text: '',
          },
        ]);
      }
      window.setTimeout(() => {
        triggerSuggestIfAvailable(backspaceAction.triggerSource);
      }, 0);
      return;
    });

    focusSuggestListenerRef.current = editor.onDidFocusEditorText?.(() => {
      const model = editor.getModel?.();
      if (!model) {
        return;
      }
      if (model.getValue().trim().length === 0) {
        triggerSuggestIfAvailable('focus');
        return;
      }
      triggerRootSuggestIfMissing('focus-root');
    });

    modelContentListenerRef.current = editor.onDidChangeModelContent?.(() => {
      completionMetaCacheRef.current = emptyCompletionMetaCache;
      const model = editor.getModel?.();
      if (!model) {
        return;
      }
      if (model.getValue().trim().length === 0) {
        window.setTimeout(() => {
          triggerSuggestIfAvailable('empty');
        }, 0);
        return;
      }

      window.setTimeout(() => {
        triggerRootSuggestIfMissing('root-gap');
      }, 0);
    });

    cursorSuggestListenerRef.current = editor.onDidChangeCursorPosition?.(() => {
      window.setTimeout(() => {
        triggerRootSuggestIfMissing('root-cursor');
      }, 0);
    });

    const model = editor.getModel?.();
    if (model && model.getValue().trim().length === 0) {
      triggerSuggestIfAvailable('mount');
    }
  }

  return (
    <div className="editor-shell" aria-label="YAML editor" style={DEFAULT_EDITOR_SHELL_STYLE}>
      {profileCatalogWarning ? (
        <div
          role="status"
          data-testid="profile-catalog-warning"
          style={{
            padding: '8px 10px',
            borderBottom: '1px solid #f2cc60',
            backgroundColor: '#fff8dd',
            color: '#6f4e00',
            fontSize: 12,
          }}
        >
          {profileCatalogWarning}
        </div>
      ) : null}
      <Editor
        path="graph.yaml"
        keepCurrentModel
        height="100%"
        defaultLanguage="yaml"
        value={value}
        onChange={(nextValue) => onChange(nextValue || '')}
        onMount={onEditorMount}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={DEFAULT_EDITOR_OPTIONS}
      />
    </div>
  );
}
