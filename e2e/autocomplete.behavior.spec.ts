import { expect, test, type Page } from '@playwright/test';
import YAML from 'js-yaml';

const HARNESS_STORY_URL = '/iframe.html?id=components-graphyamleditor--autocomplete-harness&viewMode=story';

async function waitForEditorApi(page: Page) {
  await expect
    .poll(async () => page.evaluate(() => Boolean((window as any).__graphEditorE2E)))
    .toBe(true);
}

async function setEditorState(page: Page, value: string, lineNumber: number, column: number) {
  await page.evaluate(
    ({ value, lineNumber, column }) => {
      const api = (window as any).__graphEditorE2E;
      api.setValue(value);
      api.setPosition(lineNumber, column);
      api.focus();
    },
    { value, lineNumber, column }
  );
  await expect.poll(async () => editorPosition(page)).toEqual({ lineNumber, column });
}

async function editorValue(page: Page) {
  return page.evaluate(() => (window as any).__graphEditorE2E.getValue());
}

async function editorPosition(page: Page) {
  return page.evaluate(() => (window as any).__graphEditorE2E.getPosition());
}

async function triggerSuggest(page: Page) {
  await page.evaluate(() => (window as any).__graphEditorE2E.triggerSuggest());
}

async function pressEditorKey(page: Page, key: string) {
  await page.evaluate(() => (window as any).__graphEditorE2E.focus());
  await page.keyboard.press(key);
}

async function suggestionLabels(page: Page) {
  const widget = page.locator('.suggest-widget.visible');
  await expect(widget).toBeVisible();

  const rows = widget.locator('.monaco-list-row');
  const count = await rows.count();
  const labels: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i);
    const labelNode = row.locator('.label-name');
    if ((await labelNode.count()) > 0) {
      labels.push((await labelNode.first().innerText()).trim());
      continue;
    }
    const fallback = (await row.innerText()).split('\n')[0]?.trim() || '';
    if (fallback) {
      labels.push(fallback);
    }
  }

  return labels;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__GRAPH_EDITOR_E2E__ = true;
  });
  await page.goto(HARNESS_STORY_URL);
  await waitForEditorApi(page);
});

test('root-boundary Backspace keeps same line and suggests missing root sections', async ({ page }) => {
  await setEditorState(page, 'nodes:\n  - name: A\n', 3, 1);
  await pressEditorKey(page, 'Backspace');

  await expect.poll(async () => editorPosition(page)).toEqual({ lineNumber: 3, column: 1 });
  await expect.poll(async () => suggestionLabels(page)).toEqual(['- links:']);

  await setEditorState(page, '\nlinks:\n  - from: A\n    to: A', 1, 1);
  await triggerSuggest(page);
  await expect.poll(async () => suggestionLabels(page)).toEqual(['- nodes:']);
});

test('deleting links section auto-opens missing root suggestion', async ({ page }) => {
  await setEditorState(page, 'nodes:\n  - name: A\nlinks:\n  - from: A\n    to: A', 3, 1);
  await page.evaluate(() => {
    const api = (window as any).__graphEditorE2E;
    api.setPosition(3, 1);
    api.focus();
    api.setValue('nodes:\n  - name: A\n');
    api.setPosition(3, 1);
  });
  await expect.poll(async () => suggestionLabels(page)).toEqual(['- links:']);
});

test('from endpoint supports ":" branch and Enter auto-advances to "to:"', async ({ page }) => {
  await setEditorState(page, 'nodes:\n  - name: A\nlinks:\n  - from: A', 4, 12);
  await triggerSuggest(page);
  await expect.poll(async () => suggestionLabels(page)).toEqual([':']);

  await setEditorState(page, 'nodes:\n  - name: A\nlinks:\n  - from: A:eth0', 4, 17);
  await pressEditorKey(page, 'Enter');
  await expect.poll(async () => editorValue(page)).toBe('nodes:\n  - name: A\nlinks:\n  - from: A:eth0\n    to: ');
});

test('to endpoint supports ":" branch and Enter advances to next link-step suggestions', async ({ page }) => {
  await setEditorState(page, 'nodes:\n  - name: A\nlinks:\n  - from: A\n    to: A', 5, 10);
  await triggerSuggest(page);
  await expect.poll(async () => suggestionLabels(page)).toEqual([':']);

  await setEditorState(page, 'nodes:\n  - name: A\n  - name: B\nlinks:\n  - from: A\n    to: B', 6, 10);
  await pressEditorKey(page, 'Enter');
  await expect.poll(async () => editorValue(page)).toBe('nodes:\n  - name: A\n  - name: B\nlinks:\n  - from: A\n    to: B\n  ');
  await triggerSuggest(page);
  await expect.poll(async () => suggestionLabels(page)).toEqual(['- from', 'label', 'type']);
});

test('label Enter advances to next link-step suggestions without re-suggesting label', async ({ page }) => {
  await setEditorState(page, 'links:\n  - from: A\n    to: B\n    label: my_link_label', 4, 25);
  await pressEditorKey(page, 'Enter');
  await expect.poll(async () => editorValue(page)).toBe('links:\n  - from: A\n    to: B\n    label: my_link_label\n  ');
  await triggerSuggest(page);
  await expect.poll(async () => suggestionLabels(page)).toEqual(['- from', 'type']);
});

test('selecting nested nodes key expands to first nested node name step', async ({ page }) => {
  await setEditorState(page, 'nodes:\n  - name: node-1\n    no', 3, 7);
  await triggerSuggest(page);
  await expect.poll(async () => suggestionLabels(page)).toEqual(['nodes']);

  await pressEditorKey(page, 'Enter');
  await expect.poll(async () => editorValue(page)).toBe('nodes:\n  - name: node-1\n    nodes:\n      - name: ');
});

test('after node name, selecting nodes inserts nested name step with valid yaml', async ({ page }) => {
  await setEditorState(page, 'nodes:\n  - name: node-1\n  no', 3, 5);
  await triggerSuggest(page);
  await expect.poll(async () => suggestionLabels(page)).toEqual(['nodes']);

  await pressEditorKey(page, 'Enter');
  await expect.poll(async () => editorValue(page)).toBe(
    'nodes:\n  - name: node-1\n    nodes:\n      - name: '
  );
  const value = await editorValue(page);
  expect(() => YAML.load(value)).not.toThrow();
});

test('backspace on nested trailing item line dedents one level and opens item suggestions', async ({ page }) => {
  await setEditorState(
    page,
    'nodes:\n  - name: subgraph\n    nodes:\n      - name: node-1\n        type: router\n      - name: node-2\n        type: router\n      ',
    8,
    7
  );

  await pressEditorKey(page, 'Backspace');
  await expect.poll(async () => editorPosition(page)).toEqual({ lineNumber: 8, column: 5 });
  await expect.poll(async () => editorValue(page)).toBe(
    'nodes:\n  - name: subgraph\n    nodes:\n      - name: node-1\n        type: router\n      - name: node-2\n        type: router\n    '
  );
  await expect.poll(async () => suggestionLabels(page)).toEqual(['- name']);

  const value = await editorValue(page);
  expect(() => YAML.load(value)).not.toThrow();
});
