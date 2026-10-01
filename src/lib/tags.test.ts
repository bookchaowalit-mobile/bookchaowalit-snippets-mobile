import { describe, expect, it } from 'vitest';
import { type Snippet, searchSnippets, tagCounts } from './snippets';

const s = (id: string, tags: string[]): Snippet => ({ id, title: id, language: 'text', code: id, tags, favorite: false, updatedAt: 0 });

describe('tagCounts', () => {
  it('counts tags, most used first then alphabetical', () => {
    expect(tagCounts([s('a', ['git', 'cli']), s('b', ['git']), s('c', ['utils'])])).toEqual([
      ['git', 2],
      ['cli', 1],
      ['utils', 1],
    ]);
  });
  it('pairs with searchSnippets tag filtering', () => {
    const list = [s('a', ['git']), s('b', ['utils'])];
    expect(searchSnippets(list, { tag: 'git' }).map((x) => x.id)).toEqual(['a']);
  });
});
