# Site Review & Recommendations

## Snapshot
Story-driven baby shower invite with mini-game, guestbook, and illustrative theming. Overall tone is warm and cohesive, but several UX, accessibility, and maintainability gaps remain.

## Highlights
- Rich storytelling with clear date/location and interactive touches (mini-game HUD, guestbook persistence via `localStorage`).
- Thoughtful affordances like chapter pills, keyboard/touch support, and in-game critique/achievements.

## Issues & Recommendations

### 1) Orientation & fullscreen UX
- Mobile fullscreen currently tries to lock orientation to landscape, which can feel intrusive and may fail silently depending on browser permissions. Guidance from earlier discussions favors optional hints over forced rotation.
- **Recommendation:** Remove forced `screen.orientation.lock('landscape')` and rely on responsive canvas sizing plus optional, dismissible hints about landscape benefits.
- **References:** Orientation lock inside `toggleMobileFullscreen` and paired unlock path in the fullscreen toggle handlers.【F:index.html†L678-L745】

### 2) Inline styling overload & maintainability
- Numerous inline styles for navigation, footer, and CTA blocks make theme updates tedious and undermine reuse (e.g., navigation bar and footer styling baked directly into HTML).
- **Recommendation:** Extract inline styles into reusable CSS classes (buttons, banners, footers) within `styles.css` to simplify future edits and improve consistency.
- **References:** Inline-styled navigation/CTA/footer around the chapter navigation and closing sections.【F:index.html†L540-L571】

### 3) Accessibility gaps
- No skip link or landmark roles; heavy reliance on emojis for icons without consistent text equivalents; background music control defaults to enabled and may start on interaction without clear consent messaging.
- **Recommendation:** Add skip-to-content anchor, ensure emoji icons include `aria-hidden="true"` plus visible labels, and expose an explicit music opt-in (start muted, toggle to play). Consider labeling chapter navigation as a `nav` with `aria-label`.
- **References:** Music toggle initialized as enabled, and HUD/chapter controls rely on emojis without paired labels in several spots.【F:index.html†L646-L673】【F:index.html†L340-L371】

### 4) Game responsiveness and controls
- Canvas resizing logic handles fullscreen/mobile, but touch controls hide until JS runs; orientation changes rely on a delayed resize that may leave the canvas cropped if events are blocked.
- **Recommendation:** Render touch controls by default for small viewports with CSS (then enhance via JS), and trigger `resizeCanvas` on initial load plus `visibilitychange` to avoid stale sizing when returning to the tab.
- **References:** Touch setup and resize handling in the game init and mobile optimization routines.【F:index.html†L747-L808】【F:index.html†L1993-L2081】

### 5) Content organization
- Single large HTML file mixes markup, styling (inline), and extensive game logic, which complicates diffing and performance tuning (no script/module separation or defer/async hints).
- **Recommendation:** Split concerns into separate files (e.g., `js/game.js`, `js/storybook.js`), load scripts with `defer`, and keep HTML focused on content/structure. This will also improve cacheability.
- **References:** Entire JS bundle embedded within `index.html`, beginning at the main `<script>` block and spanning initialization through game logic.【F:index.html†L575-L2081】

### 6) Guestbook UX and resilience
- Guestbook relies solely on `localStorage`; entries disappear across devices and are prone to storage exceptions. No input length guidance or profanity filtering.
- **Recommendation:** Add client-side limits (e.g., 120–200 chars), basic sanitization, and optional export/save instructions. If persistence matters, back entries with a lightweight backend or downloadable JSON.
- **References:** Guestbook submit/save/load logic using `localStorage` only.【F:index.html†L2002-L2081】

## Quick Wins (prioritized)
1. Remove orientation lock; show a gentle landscape tip near the game CTA instead.
2. Move inline nav/footer/button styles into `styles.css` and assign semantic classes.
3. Introduce skip link + start music muted with clearer toggle text.
4. Expose touch controls by default via CSS and add an initial `resizeCanvas` after first render + `visibilitychange` handler.
5. Extract JS into separate files with `defer` to improve readability and load performance.
