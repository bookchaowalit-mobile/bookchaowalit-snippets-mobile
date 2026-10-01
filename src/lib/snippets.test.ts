import { describe, expect, it } from 'vitest';
import {
  type Snippet,
  detectLanguage,
  languageCounts,
  normalizeTags,
  parseSnippets,
  searchSnippets,
  toMarkdown,
  validateSnippet,
} from './snippets';

const snip = (id: string, over: Partial<Snippet> = {}): Snippet => ({
  id,
  title: id,
  language: 'text',
  code: '',
  tags: [],
  favorite: false,
  updatedAt: 0,
  ...over,
});

describe('detectLanguage', () => {
  it.each([
    ['#!/bin/bash\necho hi', 'bash'],
    ['git status', 'bash'],
    ['{"a": [1, 2]}', 'json'],
    ['<div class="x">hi</div>', 'html'],
    ['SELECT id, name FROM users WHERE id = 1;', 'sql'],
    ['package main\nfunc main() {}', 'go'],
    ['fn main() { println!("hi"); }', 'rust'],
    ['def add(a, b):\n    return a + b', 'python'],
    ['from os import path', 'python'],
    ['interface User { id: number }', 'typescript'],
    ['const x: string = "a";', 'typescript'],
    ['.btn { color: red; }', 'css'],
    ['const add = (a, b) => a + b;', 'javascript'],
    ['just some notes', 'text'],
    ['', 'text'],
  ])('%s -> %s', (code, lang) => {
    expect(detectLanguage(code)).toBe(lang);
  });

  it('does not call broken JSON json', () => {
    expect(detectLanguage('{ not: json }')).not.toBe('json');
  });
});

describe('searchSnippets', () => {
  const list = [
    snip('a', { title: 'Debounce hook', code: 'useEffect(() => {})', tags: ['react'], language: 'typescript', updatedAt: 1 }),
    snip('b', { title: 'Fetch JSON', code: 'await fetch(url) // debounce not needed', tags: ['http'], language: 'javascript', updatedAt: 2 }),
    snip('c', { title: 'Reverse list', code: 'xs[::-1]', tags: ['python'], language: 'python', favorite: true, updatedAt: 0 }),
  ];

  it('ranks title matches above code matches', () => {
    expect(searchSnippets(list, { text: 'debounce' }).map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('requires every term', () => {
    expect(searchSnippets(list, { text: 'fetch react' })).toEqual([]);
  });

  it('filters by language, tag and favourites', () => {
    expect(searchSnippets(list, { language: 'python' }).map((s) => s.id)).toEqual(['c']);
    expect(searchSnippets(list, { tag: 'http' }).map((s) => s.id)).toEqual(['b']);
    expect(searchSnippets(list, { favoritesOnly: true }).map((s) => s.id)).toEqual(['c']);
  });

  it('orders unfiltered results by favourite then recency', () => {
    expect(searchSnippets(list, {}).map((s) => s.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('helpers', () => {
  it('normalizes tags', () => {
    expect(normalizeTags('#React, react hooks')).toEqual(['react', 'hooks']);
  });

  it('validates snippets', () => {
    expect(validateSnippet('', 'x')).toMatch(/Title/);
    expect(validateSnippet('t', '  ')).toMatch(/empty/);
    expect(validateSnippet('t', 'x')).toBeNull();
  });

  it('exports markdown with a safe fence', () => {
    expect(toMarkdown(snip('Hi', { language: 'bash', code: 'echo hi\n' }))).toBe('### Hi\n\n```bash\necho hi\n```\n');
    expect(toMarkdown(snip('Md', { code: 'a ``` b' }))).toContain('````\na ``` b\n````');
  });

  it('counts languages', () => {
    expect(languageCounts([snip('a', { language: 'go' }), snip('b', { language: 'bash' }), snip('c', { language: 'go' })])).toEqual([
      ['go', 2],
      ['bash', 1],
    ]);
  });

  it('parses stored data defensively', () => {
    expect(parseSnippets('oops')).toBeNull();
    const good = snip('a');
    expect(parseSnippets(JSON.stringify([good, { id: 1 }]))).toEqual([good]);
  });
});

describe('pass 3 edge cases', () => {
  it('drops stored snippets whose tags are not strings instead of crashing search', () => {
    const bad = JSON.stringify([{ ...snip('a'), tags: [1, null] }, snip('b', { tags: ['ok'] })]);
    const list = parseSnippets(bad)!;
    expect(list.map((s) => s.id)).toEqual(['b']);
    expect(() => searchSnippets(list, { text: 'o' })).not.toThrow();
  });
  it('dedupes tags across zero-width characters, BOM and full-width forms', () => {
    expect(normalizeTags('js, js\u200B, \uFEFFJS, ｊｓ, #react')).toEqual(['js', 'react']);
  });
  it('rejects invisible-only titles and counts code length in code points', () => {
    expect(validateSnippet('\u200B', 'x')).toBe('Title is required.');
    expect(validateSnippet('t', '😀'.repeat(15_000))).toBeNull();
  });
  it('matches "#tag" searches and decomposed accents', () => {
    const list = [snip('a', { tags: ['react'] }), snip('b', { title: 'Caf\u00e9 menu' })];
    expect(searchSnippets(list, { text: '#react' }).map((s) => s.id)).toEqual(['a']);
    expect(searchSnippets(list, { text: 'cafe\u0301' }).map((s) => s.id)).toEqual(['b']);
  });
  it('does not leave a stray CR before the closing fence for CRLF code', () => {
    expect(toMarkdown(snip('a', { code: 'x\r\n' }))).toBe('### a\n\n```\nx\n```\n');
  });
});
