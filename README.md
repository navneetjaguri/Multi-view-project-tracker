# Multi-View Project Tracker (Plain JavaScript)

A React frontend with one shared task dataset rendered in three views (Kanban, List, Timeline), custom drag-and-drop (no drag library), custom virtual scrolling (no virtualization library), URL-synced filters, and simulated live collaboration indicators.

## Setup

1. Install dependencies:
   - `npm install`
2. Start development:
   - `npm run dev`
3. Build production bundle:
   - `npm run build`
4. Preview build:
   - `npm run preview`

## State Management Choice

I used React local state (`useState`, `useMemo`, `useEffect`) because this app is a single-screen experience with one primary shared dataset and view-local derived data. This keeps state logic explicit and predictable without introducing extra abstraction overhead. If the app expanded into multi-page workflows or server-synced data, I would move to Zustand for clearer module boundaries.

## Virtual Scrolling Approach

The List view uses fixed row height (52px), viewport height (460px), and overscan buffer of 5 rows. At scroll time:

- compute `startIndex = floor(scrollTop / rowHeight) - overscan`
- compute `endIndex = ceil((scrollTop + viewportHeight) / rowHeight) + overscan`
- render only `tasks[startIndex..endIndex]`
- preserve full scroll geometry with top and bottom spacer divs

This preserves correct scrollbar size and smooth scrolling while keeping DOM node count low on 500+ tasks.

## Drag-and-Drop Approach

Drag-and-drop is implemented with pointer events (`pointerdown`, window `pointermove`, window `pointerup`) and no external library:

- on drag start, capture pointer position and card bounds
- keep original card in place and fade it as a same-height placeholder
- render a floating ghost card that follows the cursor/touch point
- detect active drop column using `document.elementFromPoint(...).closest('[data-drop-status]')`
- highlight valid drop zones while hovering
- on valid drop, update task status
- on invalid drop, animate ghost snap-back and keep data unchanged

This supports both mouse and touch using the same pointer flow.

## Lighthouse

Desktop Lighthouse target is 85+.

- Add your screenshot at: `./docs/lighthouse-desktop.png`
- Include your live report link if available.

## Live Deployment

- Live URL: _add your Vercel/Netlify URL here_

## Explanation (150-250 words)

The hardest UI problem was building drag-and-drop behavior that feels native while staying fully custom and stable across both mouse and touch. The key challenge was separating visual drag feedback from layout state. Instead of physically moving the real card node through columns during drag, I keep the original card in-flow and fade it to behave as a layout-preserving placeholder. A separate floating “ghost” element follows pointer coordinates and handles motion feedback. This prevents reflow jitter and avoids list collapse in crowded columns.  

Drop targeting is resolved by hit-testing the pointer with `elementFromPoint` and reading the nearest column marker. That made drop logic simple and reliable across nested card content. If the pointer is released outside a valid column, data is intentionally unchanged and the ghost animates out with a short snap-back transition, which communicates failure without abrupt popping.  

With more time, I would refactor drag logic into a reusable hook (`useKanbanDrag`) and add keyboard accessibility for drag operations (grab/move/drop semantics and ARIA announcements), so interaction remains inclusive while keeping the same no-library architecture.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
