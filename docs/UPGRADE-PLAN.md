# Upgrade Plan

## Current state

- Before this pass: **2/10** — Ionic/Vite scaffold with placeholder pages;
  CI masked every failure with `|| true`; `setupIonicReact()` was never
  called; no lint config, no tests, no lockfile.
- After this pass: **7/10** — working offline snippet library with tested
  search/detection logic, honest CI (typecheck, lint, test, build).

## Backlog

### P0
- Syntax highlighting in the list/editor (e.g. a small Prism build, lazy
  loaded) — currently plain monospace.
- Component tests (Vitest + @testing-library/react + jsdom) for the
  add/edit/delete flow on `Home`.

### P1
- Capacitor project (`@capacitor/core`, `cap add android`) so the README's
  "deploy as native app" step is real; use `@capacitor/clipboard` there.
- Import from Markdown / JSON backup (export exists: "Copy all as Markdown").
- Tag chips filter on Home (logic already supports `tag` in `searchSnippets`).

### P2
- Code-split Ionic (Vite warns the main chunk is >500 kB).
- Sync with the web frontend (snippets-frontend) once it has an API.

## Done in this pass

- `src/lib/snippets.ts`: language auto-detection, tag normalisation, ranked
  multi-term search with language/favourite filters, validation, safe
  Markdown export, defensive storage parsing — 25 Vitest tests.
- Home tab: searchable list, language/favourite filter chips, copy to
  clipboard, favourite toggle, add/edit/delete modal with auto-detected
  language; data persists in `localStorage` (`src/state/SnippetsContext.tsx`).
- Library tab: per-language and per-tag counts, "Copy all as Markdown".
- `setupIonicReact()` + Ionic utility CSS; ESLint 9 flat config;
  `typecheck`/`lint`/`test` scripts; committed `package-lock.json`.
- CI runs `npm ci`, typecheck, lint, test and build with no failure masking.
