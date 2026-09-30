// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SnippetsProvider, useSnippets } from '../SnippetsContext';

const STORAGE_KEY = 'snippets-mobile:v1';
let api: ReturnType<typeof useSnippets>;
const Probe: React.FC = () => {
  api = useSnippets();
  return null;
};
const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

describe('snippet add / edit / delete flow', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('adds, edits, favourites and deletes, persisting each step', () => {
    render(
      <SnippetsProvider>
        <Probe />
      </SnippetsProvider>,
    );
    expect(api.snippets).toHaveLength(2); // seed

    act(() => api.save({ title: ' List files ', code: 'ls -la', language: '', tags: 'shell, cli' }));
    const added = api.snippets[0];
    expect(added).toMatchObject({ title: 'List files', language: 'text', tags: ['shell', 'cli'], favorite: false });
    expect(stored()[0].title).toBe('List files');

    act(() => api.save({ title: 'List all files', code: 'ls -la', language: 'bash', tags: 'shell' }, added.id));
    expect(api.snippets.find((s) => s.id === added.id)).toMatchObject({ title: 'List all files', language: 'bash', tags: ['shell'] });

    act(() => api.toggleFavorite(added.id));
    expect(stored().find((s: { id: string }) => s.id === added.id).favorite).toBe(true);

    act(() => api.remove(added.id));
    expect(api.snippets.some((s) => s.id === added.id)).toBe(false);
    expect(stored()).toHaveLength(2);
  });

  it('restores a saved library instead of the seed', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'x', title: 'Mine', language: 'text', code: 'hi', tags: [], favorite: false, updatedAt: 1 }]),
    );
    render(
      <SnippetsProvider>
        <Probe />
      </SnippetsProvider>,
    );
    expect(api.snippets.map((s) => s.title)).toEqual(['Mine']);
  });
});
