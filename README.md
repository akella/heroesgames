# Heroes of Light

Short interactive project powered by Vite with three.js shaders, mini‑games, and slide flow orchestrated by XState.

## What’s inside

- Vite + ES Modules, SCSS
- three.js + shaders (via vite-plugin-glsl)
- Event bus (mitt) for inter‑module communication
- XState for slide navigation and game flow
- Modular architecture: core (scene/layers), ui (overlays/pickers/scoreboard), games (lazy‑loaded), StateMachine (config/utils/services/handlers)

## Requirements

- Node.js 18+ (LTS recommended)
- npm (or pnpm/yarn if you prefer)

## Quick start

```powershell
# Install dependencies
npm install

# Dev server
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

By default Vite serves at http://localhost:5173 (the port may differ).

## Project structure (short)

- `index.html` — base HTML, DOM layers for slides
- `css/` — styles, main entry `style.scss`
- `assets/` — images and game/room assets
- `js/app.js` — app entry, initializes managers and the flow
- `js/modules/core/` — scene/layers/state machine
  - `StateMachine/` — rules, config, helpers, and flow handlers
  - `LayerManager.js`, `generateLayers.js` — build/sync DOM layers
  - `AppController.js` — rendering, scene setup, render loop
- `js/modules/ui/` — UI (overlays, buttons, ScoreBoard)
- `js/modules/games/` — mini‑games (lazy loaded)
- `js/modules/shader/` — GLSL shaders (via Vite plugin)

## How to work with it

### Slides and navigation

- Slides are taken from the DOM (`slide1`, `slide2`, … `slide99`).
- The state machine is created dynamically from those IDs and supports events:
  - `NEXT` — go to the next slide
  - `GOTO` — go to a slide: `{ type: 'GOTO', slide: 'slide45' }`
  - Aliases `GOTO_45`, `GOTO_99` kept for compatibility.
- Auto‑advance and feature rules are defined under `StateMachine` (config + handlers).

### Room/objects/scene

- Room/object/scene changes are emitted via the event bus (`room.*`, `scene.*`).
- Parallax, zoom/offset, and canvas visibility are controlled by flow rules or scene services.

### Mini‑games

- Register in `GameManager` with lazy imports:
  ```js
  gameManager.register("puzzle", () => import("./games/puzzle/index.js"));
  ```
- Activation/deactivation/scoreboard are controlled by flow rules.
- Game completion emits a bus event (e.g. `game.puzzle.complete`) and the flow reacts with transitions.

## Tips

- Separate concerns: configs in `StateMachine/flowConfig.js`, side‑effects in `services/*`, orchestration in `FlowHandlers.js`.
- Adding a new mini‑game: register in `GameManager`, add activation rules in flow config, emit completion events from the game.
- Adding new slides: add a DOM layer with an ID like `slideN` — the flow picks it up automatically.
