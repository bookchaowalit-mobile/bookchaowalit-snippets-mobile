/**
 * Pure snippet-library logic (no Ionic/DOM imports) so it can be unit-tested.
 */

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  favorite: boolean;
  updatedAt: number;
}

export const LANGUAGES = ['typescript', 'javascript', 'python', 'bash', 'sql', 'json', 'html', 'css', 'go', 'rust', 'text'] as const;

const RULES: [string, RegExp][] = [
  ['bash', /^#!.*\b(ba|z)?sh\b|^\s*(sudo|apt(-get)?|npm|pnpm|git|cd|echo|export)\s/m],
  ['json', /^\s*[[{][\s\S]*[\]}]\s*$/],
  ['html', /^\s*<(!doctype|html|div|span|p|a|section|body|head)\b/i],
  ['sql', /\b(select\s+[\s\S]+\s+from|insert\s+into|create\s+table|update\s+\w+\s+set)\b/i],
  ['go', /^\s*package\s+\w+|\bfunc\s+\w*\s*\(|:=/m],
  ['rust', /\bfn\s+\w+\s*\(|\blet\s+mut\b|\bimpl\b|println!/],
  ['python', /^\s*(def\s+\w+\s*\(.*\)\s*:|from\s+[\w.]+\s+import\b|import\s+\w+\s*$|class\s+\w+(\(.*\))?\s*:)|\bprint\(|\bself\b|elif\s/m],
  ['typescript', /\b(interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|unknown|void)\b|as\s+const\b|<\w+>\()/],
  ['css', /^\s*[.#]?[\w-]+(\s+[\w.#-]+)*\s*\{[^}]*:[^}]*\}/m],
  ['javascript', /\b(const|let|var|function|=>|console\.log|require\(|module\.exports)\b/],
];

/** Heuristic language guess; falls back to "text". JSON must also parse. */
export function detectLanguage(code: string): string {
  const src = code.trim();
  if (!src) return 'text';
  for (const [lang, re] of RULES) {
    if (!re.test(src)) continue;
    if (lang === 'json') {
      try {
        JSON.parse(src);
      } catch {
        continue;
      }
    }
    return lang;
  }
  return 'text';
}

/** Zero-width characters and BOM: invisible, but they make "js" and "js\u200B" different strings. */
const INVISIBLE = /[\u200B-\u200D\u2060\uFEFF]/g;

/**
 * Splits on commas/whitespace, drops leading '#', and folds case, invisible
 * characters and Unicode width/composition (NFKC: "ｊｓ" -> "js") so the same
 * tag is never stored twice.
 */
export function normalizeTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .normalize('NFKC')
        .replace(INVISIBLE, '')
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#+/, '').toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 8);
}

export interface SnippetQuery {
  text?: string;
  language?: string | null;
  tag?: string | null;
  favoritesOnly?: boolean;
}

/**
 * Filters and ranks snippets. Every search term must match somewhere; title
 * matches weigh most, then tags, then code. Ties fall back to favourites,
 * then most recently updated.
 */
export function searchSnippets(snippets: Snippet[], q: SnippetQuery): Snippet[] {
  const terms = (q.text ?? '').normalize('NFC').toLowerCase().split(/\s+/).filter(Boolean);
  const scored: [Snippet, number][] = [];
  for (const s of snippets) {
    if (q.language && s.language !== q.language) continue;
    if (q.tag && !s.tags.includes(q.tag)) continue;
    if (q.favoritesOnly && !s.favorite) continue;
    let score = 0;
    let all = true;
    for (const t of terms) {
      const inTitle = s.title.normalize('NFC').toLowerCase().includes(t);
      const inTags = s.tags.some((tag) => tag.includes(t.replace(/^#+/, '') || t)); // "#react" finds tag "react"
      const inCode = s.code.normalize('NFC').toLowerCase().includes(t);
      if (!inTitle && !inTags && !inCode) {
        all = false;
        break;
      }
      score += (inTitle ? 5 : 0) + (inTags ? 3 : 0) + (inCode ? 1 : 0);
    }
    if (all) scored.push([s, score]);
  }
  return scored
    .sort((a, b) => b[1] - a[1] || Number(b[0].favorite) - Number(a[0].favorite) || b[0].updatedAt - a[0].updatedAt)
    .map(([s]) => s);
}

export function validateSnippet(title: string, code: string): string | null {
  if (!title.replace(INVISIBLE, '').trim()) return 'Title is required.';
  if (!code.replace(INVISIBLE, '').trim()) return 'Code cannot be empty.';
  // Count code points so emoji/CJK-heavy snippets are measured as the user sees them.
  if ([...code].length > 20_000) return 'Snippet is too large (max 20,000 characters).';
  return null;
}

/** Markdown fenced block; uses a longer fence if the code itself contains ```. */
export function toMarkdown(s: Snippet): string {
  const longest = Math.max(2, ...(s.code.match(/`+/g) ?? []).map((m) => m.length));
  const fence = '`'.repeat(longest + 1);
  const lang = s.language === 'text' ? '' : s.language;
  return `### ${s.title}\n\n${fence}${lang}\n${s.code.replace(/[\r\n]+$/, '')}\n${fence}\n`;
}

export function languageCounts(snippets: Snippet[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const s of snippets) counts.set(s.language, (counts.get(s.language) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function parseSnippets(json: string | null): Snippet[] | null {
  if (!json) return null;
  try {
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) return null;
    return data.filter(
      (s): s is Snippet =>
        typeof s?.id === 'string' &&
        typeof s.title === 'string' &&
        typeof s.code === 'string' &&
        typeof s.language === 'string' &&
        Array.isArray(s.tags) &&
        s.tags.every((t: unknown) => typeof t === 'string') &&
        typeof s.updatedAt === 'number',
    ).map((s) => ({ ...s, favorite: Boolean(s.favorite) }));
  } catch {
    return null;
  }
}

/** Tag usage counts, most used first (ties alphabetical). */
export function tagCounts(snippets: Snippet[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const s of snippets) for (const t of s.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
