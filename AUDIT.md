# Dungeon Crawler Game Audit

## Executive Summary
- The current Honey Pot Catch implementation delivers a feature-rich arcade loop with pooling, power-ups, combo scoring, and input support across keyboard, touch, and gamepad, but the codebase is monolithic and HTML-first rather than canvas/game-first, making extensibility, testing, and accessibility harder.
- Rendering and update logic are tightly coupled inside a single `Game` class with ad-hoc state and manual DOM querying, leaving room for architecture refactors (ECS or modular scene/state managers), improved asset lifecycle, and clearer separation between UI chrome and playfield logic.
- UX lacks onboarding, discoverability for inputs, and clear feedback for error states; accessibility and responsiveness are partial (some ARIA/hotkeys present) but inconsistent across screens and the game canvas.
- Performance employs requestAnimationFrame, object pooling, and debug sampling, yet collision detection is O(n^2) across lists, there is no spatial partitioning, and bundle/cache strategies are absent (no service worker, no code splitting), limiting mobile FPS and cold-start metrics.

## Critical Issues (P0–P2)
- **P0: No offline/PWA caching for game assets.** The project links a manifest but omits a service worker and runtime caching, so assets (fonts, sprites, audio) refetch every session and the game fails offline. (Missing implementation).
- **P1: Monolithic game loop with coupled rendering/state.** The `Game` class manages input, spawning, collision, rendering, particles, UI, and audio directly in one file; there is no module boundary or scene/state manager, making regression risk high when tuning systems.【F:game.js†L790-L855】【F:game.js†L903-L984】
- **P1: Collision checks scale poorly.** Pots, bees, and power-ups iterate over full arrays with square-root distance checks every frame, with no spatial partitioning or broad-phase filter; this becomes O(n^2) and limits 60 FPS on mobile.【F:game.js†L1023-L1064】
- **P1: Input safety gaps.** Touch/gamepad/keyboard are merged without debouncing on resize or device changes, and there is no dead-zone or analog scaling on gamepad axes, affecting accuracy for expert players.【F:game.js†L861-L901】
- **P2: Accessibility gaps on the playfield.** The canvas lacks ARIA roles, focus traps, and keyboard remapping for mobility users; only the shell has skip links and toggles, so the core game is not screen-reader friendly. (Observation; no canvas ARIA/controls).

## Technical Debt Assessment
- **Architecture:** Single bundle JS without ES modules or build tooling; state is mutable and spread across `this.state` bags. Suggest introducing ES module boundaries (input, physics, rendering, UI, audio) and a lightweight ECS or state-machine for modes.
- **Performance:** Uses `requestAnimationFrame`, fixed timestep, pooling, and FPS sampling, but lacks spatial partitioning (quad-tree/Uniform Grid), draw-call budgeting, and asset atlas batching. Collision uses repeated `Math.sqrt` per pair.【F:game.js†L1023-L1064】
- **Asset pipeline:** No preloader queue or loader for images/audio; manifest prefetches images but no retry/backoff, fallback fonts, or compressed sprite atlases. (Observation in `game.html`).
- **Testing/metrics:** No automated tests, CI, or runtime analytics; debug panel exists but is manual and gated by localStorage.【F:game.js†L10-L69】
- **Progression/balance:** Difficulty and rewards are primarily time-based with stochastic spawns; there is no explicit difficulty curve, XP/level, or loot table balancing model.【F:game.js†L958-L1021】【F:game.js†L1066-L1121】

## UX Friction Points
- **Learnability:** No in-game tutorial overlay, input hints, or tooltips; new users must infer controls. (Observation from `game.html`).
- **Efficiency:** No hotkeys for pause/restart or quick inventory; pointer targeting is screen-percentage based, which is coarse on large screens.【F:game.js†L861-L901】
- **Error prevention:** Game over only after lives depletion; there are no confirmation dialogs for exit/restart, and autosave is absent.
- **Feedback:** Collisions trigger particles and notifications, but accessibility mode/reduced motion preferences do not gate these effects, risking discomfort. (Particle usage in `collectPot`/`hitByBee`).【F:game.js†L1107-L1153】

## Visual Design Inconsistencies
- **Design tokens absent:** Colors, spacing, radii, and typography are hard-coded in inline styles and CSS rather than centralized tokens/custom properties. (Observation across `game.html` styles).
- **Stateful components:** Buttons and HUD lack consistent hover/focus/disabled states; no skeletons inside the game canvas.
- **Motion system:** Animations use generic easing and do not respect `prefers-reduced-motion`; particles, wobble, and screen shake fire unconditionally.【F:game.js†L893-L901】【F:game.js†L1107-L1153】

## Recommended Implementation Plan

### Phase 1: Foundation (Weeks 1–2)
- **Refactor HTML for accessibility:** Add ARIA roles to canvas container, provide keyboard remapping UI, and implement focus management around the game shell.
- **Introduce design tokens:** Create `styles/tokens.css` with CSS custom properties (colors/spacing/typography) consumed by `styles-game.css`; add light/dark variants and WCAG-compliant contrasts.
- **Modularize JS:** Split `game.js` into ES modules (`core/loop.js`, `systems/input.js`, `systems/collision.js`, `systems/spawn.js`, `ui/hud.js`); export a `Game` orchestrator that composes systems. Use Vite/Rollup for bundling.
- **Service worker setup:** Add Workbox-based service worker to cache `game.js` bundle, sprite atlases, fonts, and audio; include offline fallbacks and versioned cache busting.

### Phase 2: Core Mechanics (Weeks 3–4)
- **Game loop tuning:** Keep fixed timestep but cap accumulator; add frame-budget logging; move rendering to its own system and measure draw calls per frame. Replace per-frame `Math.sqrt` with squared-distance checks.
- **Collision optimization:** Implement uniform-grid spatial hash (cell size ≈ max radius*2); broad-phase gather near cells before narrow-phase checks. This reduces collision checks to near O(n).
- **Input system:** Add dead-zone and sensitivity curves for gamepad axes; throttle pointer move; support rebindable keys and hold-to-charge mechanics if desired.
- **Asset loading:** Add preload queue with promises and progress events; lazy-load non-critical assets; convert sprites to WebP/AVIF and sprite atlas to reduce draw calls.

### Phase 3: Polish (Weeks 5–6)
- **Juice with accessibility:** Gate particle counts and screen shake behind reduced-motion preference; add hit-stop, camera kick, and chromatic flashes with WCAG-safe contrasts.
- **Save system:** Implement localStorage/IndexedDB save slots for stats, settings, and runs; include schema versioning and migrations.
- **Analytics/metrics:** Instrument FPS, memory, spawn counts, and input latency; expose debug overlay toggle and send anonymized metrics to a dashboard (opt-in).

### Technical Refactor Plan
- **Code splitting:** Define entry `src/main.js` importing systems; use dynamic import for non-critical UI (leaderboards, cosmetics). Target <150KB gzipped for core bundle.
- **WebGL/Canvas 2D performance:** Evaluate moving particle system to OffscreenCanvas or WebGL for batching; if staying in 2D, batch draws by sprite sheet and minimize state changes.
- **Service Worker caching:** Use Workbox `StaleWhileRevalidate` for CDN fonts/icons and `CacheFirst` for game assets; precache core bundle and manifest; add runtime cache limits.
- **Bundle size targets:** Compress assets (WebP/AVIF), tree-shake Font Awesome (use subset), remove unused DOM code; aim for <2MB compressed total and <250KB JS gzip for initial load.

### UX Flow Re-engineering
- **Persona journeys:**
  - *New player:* Landing → tutorial overlay (movement + avoid bees) → short run → soft fail with guidance.
  - *Casual:* Landing → continue last run → mid-length session → surface goals (daily quests) → exit with progress save.
  - *Expert:* Landing → speed start (hotkey) → high-difficulty mode → leaderboard/seeded run → quick restart loop.
- **Fitts' Law:** Increase tap targets to 48px min; keep primary actions bottom-right on mobile; ensure pause/restart are within thumb reach.
- **Cognitive load:** Limit simultaneous UI elements to ≤5 on HUD; contextually hide non-essential stats; stagger notifications and throttle to 1/sec.

### Visual Redesign System
- **Design tokens:** Define `color.surface`, `color.accent`, `color.danger`, `space.xs–xl`, `radius.s–l`, `font.body`, `font.display` tokens with light/dark variants and 4.5:1 contrast minimum.
- **Component library:** Build button (default/ghost/destructive), HUD badge (normal/alert), modal, toast, and progress components with hover/focus/disabled states; document variants in Storybook or similar.
- **Loading skeletons:** Add canvas overlay skeleton for level intro and HUD placeholders; use shimmer animation respecting reduced-motion.

### Game Balance Analysis
- **Difficulty curves:** Model spawn rates and speed scaling as functions of time and player score; fit target curve where hazard frequency increases logarithmically while power-up frequency decays mildly.
- **Monte Carlo loot simulation:** Run 100k simulated drops using current spawn/score rules to balance heart/shield/clock frequency; tune to maintain target survival time and expected score distribution.
- **Playtesting plan:** 10 sessions per persona; measure time-to-first-hit, average score, and input error rate; use think-aloud for onboarding friction.

## Implementation Priorities
1. Service worker + asset compression (offline + performance).
2. Module architecture with spatial collision system.
3. Accessibility pass (controls remap, reduced motion gating) + design tokens.
4. Balance modeling + telemetry.
