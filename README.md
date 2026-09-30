# Snippets — Mobile

Ionic + React cross-platform mobile app for **Snippets**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Tech Stack

- **Framework:** Ionic 8 + React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **UI:** Ionic Components + Ionicons

## Features

- **Snippet library** (Snippets tab): save code with title, tags and a
  language (auto-detected if you leave it on "Auto"); edit or delete by
  tapping a snippet.
- **Search** across titles, tags and code — every term must match, title hits
  rank first; filter by language or favourites.
- One-tap **copy to clipboard** and **favourite** toggle.
- **Library** tab: language/tag breakdown and "Copy all as Markdown" export.
- Works offline; data is stored locally in the browser/webview
  (`localStorage`), no account or backend.

## Getting Started

```bash
npm ci
npm run dev
```

## Validation

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Pure logic lives in `src/lib/snippets.ts` and is unit-tested with Vitest.
CI (`.github/workflows/build.yml`) runs the same commands and fails on errors.
See `docs/UPGRADE-PLAN.md` for the backlog.

## Build

```bash
npm run build
# Output in dist/ — deploy as a static PWA (Capacitor is not set up yet)
```

## Related

- **Frontend:** [bookchaowalit-website/snippets-frontend](https://github.com/bookchaowalit-website/snippets-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
