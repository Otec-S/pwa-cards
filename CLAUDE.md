# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm run build        # compile TypeScript (tsc)
npm run dev          # build + start http-server on http://localhost:8000
npm run watch        # tsc --watch (run http-server separately in another terminal)
npm run clean        # remove compiled JS files from root
```

To run the dev server standalone after a watch build:
```bash
npx http-server . -p 8000
```

There are no tests currently configured (vitest.config.ts exists but no test files or test script in package.json).

## Architecture

TypeScript sources live in `src/` and compile **directly to the project root** (`outDir: "."` in tsconfig). There is no bundler — the browser loads `app.js` as a native ES2020 module (`<script type="module">`).

**Key files:**
- `src/types.ts` — shared interfaces (`Card`, `AppState`, `TouchState`)
- `src/app.ts` — all app logic: state management, DOM binding, navigation, swipe/keyboard handling, Service Worker registration
- `src/sw.ts` — Service Worker with cache-first strategy

**State model:** a single module-level `AppState` object in `app.ts` holds `cards[]`, `currentIndex`, and `isAnimating`. Position persists to `localStorage` under the key `cardIndex`.

**Data source:** `cards.json` — a flat JSON array of `{id: number, text: string}` objects. Loaded at runtime via `fetch('cards.json')`.

**Service Worker caching:** uses a versioned cache (`CACHE_NAME = 'pwa-cards-v3'` in `src/sw.ts`). After changing any static asset, bump this version to force cache invalidation on next load. PWA features (Service Worker, install prompt) only work on HTTPS or `localhost`.

**Animation:** `applyAnimation()` in `app.ts` guards concurrent transitions via `isAnimating` flag and uses CSS class toggling with `ANIMATION_DURATION = 300ms` timeouts.

---