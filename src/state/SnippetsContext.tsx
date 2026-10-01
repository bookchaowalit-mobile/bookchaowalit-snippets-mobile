import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type Snippet, detectLanguage, normalizeTags, parseSnippets } from '../lib/snippets';

const STORAGE_KEY = 'snippets-mobile:v1';

const SEED: Snippet[] = [
  {
    id: 'seed-1',
    title: 'Debounce a function',
    language: 'typescript',
    code: 'export function debounce<T extends (...args: never[]) => void>(fn: T, ms = 300) {\n  let t: ReturnType<typeof setTimeout>;\n  return (...args: Parameters<T>) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n}',
    tags: ['utils', 'timing'],
    favorite: true,
    updatedAt: 0,
  },
  {
    id: 'seed-2',
    title: 'Undo last commit (keep changes)',
    language: 'bash',
    code: 'git reset --soft HEAD~1',
    tags: ['git'],
    favorite: false,
    updatedAt: 0,
  },
];

export interface SnippetDraft {
  title: string;
  code: string;
  language: string;
  tags: string;
}

interface SnippetsContextValue {
  snippets: Snippet[];
  save: (draft: SnippetDraft, id?: string) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

const SnippetsContext = createContext<SnippetsContextValue | null>(null);

function load(): Snippet[] {
  try {
    return parseSnippets(localStorage.getItem(STORAGE_KEY)) ?? SEED;
  } catch {
    return SEED;
  }
}

export const SnippetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snippets, setSnippets] = useState<Snippet[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
    } catch {
      // Storage full or blocked: keep working in memory.
    }
  }, [snippets]);

  const save = useCallback((draft: SnippetDraft, id?: string) => {
    const now = Date.now();
    const fields = {
      title: draft.title.trim(),
      code: draft.code,
      language: draft.language || detectLanguage(draft.code),
      tags: normalizeTags(draft.tags),
      updatedAt: now,
    };
    setSnippets((prev) =>
      id
        ? prev.map((s) => (s.id === id ? { ...s, ...fields } : s))
        : [{ id: `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, favorite: false, ...fields }, ...prev],
    );
  }, []);

  const remove = useCallback((id: string) => setSnippets((prev) => prev.filter((s) => s.id !== id)), []);
  const toggleFavorite = useCallback(
    (id: string) => setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s))),
    [],
  );

  const value = useMemo(() => ({ snippets, save, remove, toggleFavorite }), [snippets, save, remove, toggleFavorite]);
  return <SnippetsContext.Provider value={value}>{children}</SnippetsContext.Provider>;
};

export function useSnippets(): SnippetsContextValue {
  const ctx = useContext(SnippetsContext);
  if (!ctx) throw new Error('useSnippets must be used inside <SnippetsProvider>');
  return ctx;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
