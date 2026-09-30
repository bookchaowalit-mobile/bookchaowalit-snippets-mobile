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

### P1
- E2E/browser test for the edit modal (IonModal needs a real browser, e.g. Playwright against `vite preview`).
- Capacitor project (`@capacitor/core`, `cap add android`) so the README's
  "deploy as native app" step is real; use `@capacitor/clipboard` there.
- Import from Markdown / JSON backup (export exists: "Copy all as Markdown").

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

## Done in this pass (pass 2)

Score: 7/10 (was 6/10) — tag filtering, keyboard-operable filters and component tests; syntax highlighting still open.

- Component tests (Vitest + jsdom + @testing-library/react): the add/edit/favourite/delete flow is tested through `SnippetsProvider` (persisting each step, restoring a saved library); Home list tests cover tag filtering, keyboard chips and favouriting. `IonModal` does not run under jsdom, so the modal UI itself is still untested (see P1). 32 tests total.
- Tag chips on Home (`tagCounts`, tested) wired to the existing `searchSnippets` tag filter.
- Accessibility: filter chips were click-only `IonChip`s; a `FilterChip` wrapper makes them focusable with Enter/Space and descriptive labels. Favourite/copy buttons now name the snippet.
- Advisories: `npm audit --omit=dev` is clean; dev-only vite 5/esbuild/vitest findings need major upgrades.
- Verified: typecheck, lint, vitest, `npm run build`.
