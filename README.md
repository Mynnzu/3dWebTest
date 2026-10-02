# AETHER — Time, laid bare.

An interactive watch study built with Three.js and Vite. The interface uses locally bundled Italiana and DM Sans fonts, warm ivory surfaces, olive typography and terracotta accents.

## Run locally

```sh
npm install
npm run dev
```

On Windows PowerShell, use `npm.cmd` if script execution policies prevent `npm` from running. The development URL is normally `http://localhost:5173`.

## Experience

- Nine scroll-driven chapters with an index, chapter progress buttons, previous/next controls and optional story playback.
- A procedural watch with studio environment reflections, rounded bracelet links, printed dial details, toothed gears and a moving escapement.
- Drag or use the canvas arrow keys to rotate; Home or the reset control restores the view.
- Seven inspectable component layers and independently rendered front and exhibition-back views.
- Dial, hardware and bracelet finishes; four edition presets; local configuration persistence and a downloadable composition file.
- Mobile layouts, keyboard navigation, focus management, reduced-motion support, animation pause, and a fallback when WebGL is unavailable.

The watch and specifications form a conceptual digital study, rather than an engineering-accurate manufacturing model. All visual assets are generated locally; no external 3D assets, fonts or services are required at runtime.

## Validation

```sh
npm run build
npm test
```

Browser tests use an installed Google Chrome through Playwright. They cover all chapters, component inspection, configuration persistence, downloads, keyboard navigation, story playback, mobile layouts and WebGL fallback. To use Playwright's own Chromium instead, install it with `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.js`.

## Files

- `index.html`: semantic content, chapter navigation and persistent controls.
- `src/style.css`: typography, layout, responsive design and motion preferences.
- `src/main.js`: scene lighting, camera timeline, viewports and input handling.
- `src/watch-model.js`: procedural geometry, materials and mechanical animation.
- `src/configurator.js`: finish choices, presets, persistence and export.
- `tests/experience.spec.js`: browser integration checks.

Rendering is capped at 30 frames per second with limited pixel density. It stops drawing when animation is paused and the view settles; background tabs suspend the frame loop.
