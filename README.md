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
