# Letar Inc. Website — Scroll Retune & Polish

**Date:** 2026-07-05
**Repo:** `letar-website` (deployed to `vishnuce22.github.io/letar-website` → `letarinc.com`)
**Scope decisions (confirmed with owner):**
- Scroll fix: **Approach B — Retune the engine** (keep the film + all content; replace the fragile scroll plumbing).
- Polish: **Landing + 5 content pages** (`index`, `about`, `markets`, `capabilities`, `certifications`, `contact`). Legal pages inherit only.
- Hard constraint: **polish stays inside the existing "Inspection Document" design system** — no new colors, no new fonts. Refinement only.

---

## 1. Problem statement

The landing (`index.html`) is a scroll-scrubbed video "film": GSAP + ScrollTrigger, six `.vchap` video chapters that pin fullscreen, a sticky Three.js 3D "part" interlude, and a Three.js "LetarOS Command Center" scene behind the closing CTA. The owner reports **all four** scroll symptoms: janky/stuttery, feels stuck/trapped, jumps/snaps oddly, broken on mobile.

### Root causes (code-confirmed)

| Symptom | Cause | Location |
|---|---|---|
| **Stuck / trapped** | `.vchap` is `height: 240vh` with a `sticky` 100vh frame → ~140vh of dead scroll per chapter. 6 chapters + a `320vh` part section = ~17 viewport-heights, much of it visually static. | `css/styles.css:819`, `:895` |
| **Jumps / snaps** | A JS "settle-snap" waits for input-quiet then fires `window.scrollTo({behavior:'smooth'})` to yank the viewport to the nearest pinned scene; fragile direction heuristic, collides with wheel/touch momentum. | `js/film/videos.js:77-107` |
| **Janky** | GSAP `scrub` timelines recompute **video opacity every scroll tick** (HD video compositing is expensive); two always-on WebGL render loops; multiple HD videos decoding at once (siblings not hard-paused). | `js/film/videos.js:54-68`, `part-section.js`, `landing-cc.js` |
| **Broken on mobile** | 3D is disabled <861px, but `videos.js` (settle-snap + autoplaying HD video) still runs; heights use `100vh` not `100dvh`, so iOS's dynamic toolbar makes pinned frames taller than the screen (content cut off, can't reach bottom); `scrollTo` smooth-snap fights touch momentum. | `css/styles.css:822`, `js/film/videos.js` |

The content and cinematic concept are strong. The **scroll plumbing** is what needs surgery.

---

## 2. Scroll retune — Approach B

### 2.1 Remove the settle-snap (the biggest offender)
- Delete the entire settle-snap block in `js/film/videos.js` (the `filmSections` / `settle` / `arm` / wheel+touch+scroll listeners, currently lines ~77-107).
- No JS replacement. Native scroll only.
- **Optional, tunable:** CSS `scroll-snap-type: y proximity` on the film container with `scroll-snap-align: start` on `.vchap-frame`. `proximity` (never `mandatory`) lets the user stop anywhere and only nudges when already close — browser-native, no JS fight. Ship **off by default**; enable only if it demonstrably improves rest points in the verification pass.

### 2.2 Trim the holds
- `.vchap { height: 240vh }` → `height: 150vh` (≈50vh hold after the 100vh enter/leave travel).
- `#part3d.part3d-section { height: 320vh }` → `~260vh`, and re-verify the three caption/3D beats (`part-section.js` timeline positions 0→3.2) still have room; adjust beat `at` positions proportionally if a beat feels rushed.
- Net landing length target: ~10 viewport-heights (down from ~17).

### 2.3 Replace per-tick opacity scrub with native scroll + CSS crossfade
- Remove the GSAP scrub timelines that animate `video` opacity per tick (`videos.js:54-68`).
- Chapter visibility rides the **existing** `.on` IntersectionObserver (`videos.js:27-43`, ratio ≥ 0.45). CSS handles the fade: `transition: opacity` on the caption (already keyed to `.on`), and the video is simply visible whenever its sticky frame is on-screen. As one chapter's frame scrolls up and the next comes into view, it reads as a clean native push — no compositing churn.
- **Keep** GSAP ScrollTrigger for the `part3d` 3D beats only — there, scroll→3D-timeline scrubbing is the actual feature, and it's already desktop-gated.

### 2.4 Reduce jank
- **One video at a time:** in the `player` observer, hard-`pause()` any chapter whose frame is not the active `.on` one (tighten from the current `ratio <= 0.15` so at most one video ever plays).
- Cap `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))` in both `part-section.js` and `landing-cc.js` (down from 1.75).
- Confirm both rAF render loops early-return when their section is off-screen (already gated via `visible`; verify no `renderer.render` runs off-screen).
- Keep `preload="none"` + lazy `IntersectionObserver` loader; ensure only current + next chapter preload.

### 2.5 Fix mobile (<861px)
- Swap `100vh` → `100dvh` for `.vchap-frame` and `.part3d-sticky` (and any mobile height rules). Use `svh`/`dvh` so the dynamic toolbar can't overflow the pinned frame.
- Below 861px, the film goes **fully static** — mirror the existing `.no-part3d` fallback pattern for the 3D section, extended to the video chapters:
  - `.vchap` becomes `height: 100vh`/auto, `.vchap-frame { position: static }` (already true at ≤860 in `styles.css:844-845` — keep and extend).
  - Each chapter shows a **poster still + caption** in normal document flow. No autoplay, no scrubbing, no settle-snap.
- **Guard `videos.js`:** wrap the play/pause observer, the (now-removed) snap, and any autoplay in a `matchMedia('(min-width: 861px)')` check so mobile runs a purely static path. Keep the lazy caption reveal.
- **Posters:** extract frame 0 of each `assets/gen/*-hd.mp4` to `assets/gen/*-poster.jpg` using the `ffmpeg-static` dev-dependency already in `package.json`. Add a small `scripts/` node script (`extract-posters.js`) so posters are reproducible. Reference them via the `<video poster="…">` attribute (desktop gets it as the pre-play frame too) and as the `<img>` shown in the mobile static path.

### 2.6 Accessibility / reduced motion
- `prefers-reduced-motion: reduce` already disables autoplay/holds — preserve that path through all changes.
- Verify keyboard scroll (space / arrows / PageDown) is smooth with the snap removed.

---

## 3. Polish pass — within the "Inspection Document" system

**No palette changes. No new fonts.** Space Grotesk / Inter / JetBrains Mono and the `:root` token set stay exactly as-is. Titanium-anodize gradient remains the single loud accent. This is refinement, not a reskin.

### 3.1 Spacing & rhythm
- The content pages sprinkle ad-hoc inline overrides (e.g. `capabilities.html` has `style="padding-bottom:48px"`, `style="padding-top:24px"`, an inline `font-size` clamp on `h1`). Consolidate into a small set of section utilities (e.g. `.section`, `.section-tight`, `.section-alt` already exist) so vertical rhythm is consistent page-to-page. Remove one-off inline paddings where a utility covers it.

### 3.2 Typography
- Enforce the shared type scale; drop per-page inline `font-size` heading overrides unless a hero deliberately needs it (document any intentional exception in the page).
- Consistent `.eyebrow` / `.lede` usage and spacing.

### 3.3 Interaction states
- Consistent hover on cards (lift via `--shadow-lift`), buttons, links, and nav items.
- **Visible focus rings** on all interactive elements (a11y) — currently thin; ensure a clear `:focus-visible` outline in the blue accent.

### 3.4 Micro-consistency
- Fix cross-page drift: footer doc revision letter differs (`index` = REV D, `capabilities` = REV C) — pick one, apply everywhere.
- Corner-tick / title-block motif, spec-table styling, and card treatments consistent across the 5 pages.

### 3.5 Method
- Per page: read → apply refinements → one browser glance. Grounded in each page's real content, not blanket edits.

---

## 4. Out of scope
- **Data plumbing unchanged** — Supabase forms (`js/supabase-client.js`), RLS insert-only policies, honeypot, and the `quote_requests` / `contact_messages` / `website_leads` tables. Per the repo README: the redesign changes the skin, not the plumbing.
- No palette or font changes.
- Legal pages (`privacy`, `terms`, `supplier-terms`) get only what they inherit from shared CSS.
- `classic.html`, `dev.html`, `review.html` (dev/legacy artifacts) untouched.

---

## 5. Verification (per project testing policy)
Scroll feel, snap, jank, and mobile breakage are exactly what only a browser reveals — so this is the sanctioned browser case (budget: ~2 passes).
1. **Desktop pass** (Chrome DevTools MCP): scroll top→bottom of `index.html`; confirm no snap-yank, smooth wheel/trackpad, one video at a time. Run a `performance_start_trace` while scrolling to confirm FPS holds (target: no sustained long-frame cluster during scroll).
2. **Mobile-emulated pass** (`resize_page` to ~390×844): confirm each chapter is a static poster+caption, page reaches the footer, no cut-off frames, no touch-scroll fight.
3. Quick click-through of the 5 content pages for the polish pass (visual glance each).

## 6. Success criteria
- No `window.scrollTo`-driven snapping anywhere in the film.
- Landing scroll length ≈10 viewport-heights (was ~17).
- Single video decoding at any moment on desktop; static posters on mobile.
- `index.html` scrolls smoothly on desktop and reaches the footer cleanly on a 390px-wide emulated phone.
- Content pages share one spacing/type rhythm; visible focus states everywhere; no palette/font drift.
