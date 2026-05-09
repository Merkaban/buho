# Phase 1: PWA Shell & Project Setup - Research

**Researched:** 2026-05-09
**Domain:** Progressive Web App (React + Vite + iOS PWA)
**Confidence:** HIGH

## Summary

This phase establishes a greenfield React 19 + Vite + TypeScript project configured as an installable, offline-capable PWA targeting iOS Safari. The core technical challenges are: (1) correct iOS PWA meta tags and manifest for standalone mode, (2) service worker precaching all static assets for offline use, (3) CSS safe area handling for notch/home indicator, and (4) a 3-panel swipeable navigation using CSS scroll-snap.

The stack is well-established with high ecosystem maturity. vite-plugin-pwa handles service worker generation and manifest injection with minimal configuration. Tailwind CSS 4 uses a CSS-first configuration model (no tailwind.config.js). The swipe navigation can be implemented with native CSS scroll-snap (full iOS Safari support since v11) rather than react-swipeable, providing better performance and native momentum scrolling.

**Primary recommendation:** Use `npm create vite@latest` with the React + TypeScript template, add vite-plugin-pwa with `registerType: 'autoUpdate'` and `generateSW` strategy, configure Tailwind CSS 4 via `@tailwindcss/vite` plugin, and implement swipe navigation with CSS `scroll-snap-type: x mandatory`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Host on Vercel (free tier, auto-deploy from Git, HTTPS included)
- **D-02:** Use default .vercel.app URL — no custom domain needed
- **D-03:** User handles Vercel account/repo setup — no deployment instructions needed in plan
- **D-04:** 3 swipeable screens: Landing (brand), Breathing (placeholder), Meditation (placeholder)
- **D-05:** Swipe navigation scaffolded in Phase 1 (not deferred to Phase 6)
- **D-06:** Page indicator dots at the bottom showing active panel (3 dots)
- **D-07:** Landing screen shows app name and logo (logo provided by user later — use placeholder asset slot)
- **D-08:** Home screen name (short_name): "buho"
- **D-09:** Full name: "mindfulONE"
- **D-10:** Theme color and background: pure black (#000000)
- **D-11:** Icon will be provided by user — create placeholder icon slots at required sizes (192x192, 512x512 minimum)
- **D-12:** Pure black background (#000000), not dark gray
- **D-13:** Minimal dark aesthetic throughout — calm and uncluttered
- **D-14:** Breathing screen placeholder: static white circle centered on black background
- **D-15:** Meditation screen placeholder: simple text/message on black background

### Claude's Discretion
None specified — all decisions are locked.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PWA-01 | App is installable on iOS via Add to Home Screen | Manifest configuration with correct icons, display: standalone, apple-touch-icon link tag, apple-mobile-web-app-capable meta tag |
| PWA-02 | App works fully offline after initial load | vite-plugin-pwa with generateSW strategy, globPatterns precaching all static assets |
| PWA-03 | App runs in standalone mode without browser chrome | manifest display: standalone + apple-mobile-web-app-capable + apple-mobile-web-app-status-bar-style meta tags |
| PWA-04 | App handles iOS safe areas (notch, home indicator) | viewport-fit=cover meta tag + env(safe-area-inset-*) CSS variables on outermost container |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PWA installability | Browser / Client | CDN / Static | Manifest + meta tags served statically, browser interprets them |
| Offline caching | Browser / Client | -- | Service worker runs entirely in browser, precaches at install time |
| Standalone display | Browser / Client | -- | iOS interprets manifest + meta tags to remove browser chrome |
| Safe area handling | Browser / Client | -- | CSS env() variables handled by browser rendering engine |
| Swipe navigation | Browser / Client | -- | CSS scroll-snap + minimal JS for dot state |
| Static asset serving | CDN / Static | -- | Vercel serves built assets with HTTPS |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.6 | UI framework | [VERIFIED: npm registry] Component model fits multi-screen app |
| react-dom | 19.2.6 | React DOM renderer | [VERIFIED: npm registry] Required by React |
| vite | 8.0.11 | Build tool + dev server | [VERIFIED: npm registry] Fast HMR, excellent plugin ecosystem |
| @vitejs/plugin-react | 6.0.1 | React Fast Refresh for Vite | [VERIFIED: npm registry] Official React plugin for Vite |
| typescript | 6.0.3 | Type safety | [VERIFIED: npm registry] Catches errors at build time |
| tailwindcss | 4.3.0 | Utility-first CSS | [VERIFIED: npm registry] CSS-first config in v4, zero runtime |
| @tailwindcss/vite | 4.3.0 | Tailwind Vite integration | [VERIFIED: npm registry] Replaces PostCSS plugin from v3 |
| vite-plugin-pwa | 1.3.0 | PWA manifest + service worker | [VERIFIED: npm registry] Zero-config Workbox integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| workbox-precaching | 7.4.1 | SW precache runtime (peer dep) | [VERIFIED: npm registry] Required by vite-plugin-pwa |
| workbox-window | 7.4.1 | SW registration client (peer dep) | [VERIFIED: npm registry] Required by vite-plugin-pwa |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS scroll-snap | react-swipeable (7.0.2) | react-swipeable gives JS control over swipe but adds bundle size; CSS scroll-snap provides native momentum and 60fps on iOS with zero JS |
| generateSW | injectManifest | injectManifest allows custom SW logic but adds complexity; generateSW is sufficient for static precaching |
| Tailwind CSS | CSS Modules | CSS Modules are dependency-free but slower iteration; Tailwind faster for utility-first dark theme work |

**Installation:**
```bash
npm create vite@latest mindfulone -- --template react-ts
cd mindfulone
npm install
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa workbox-precaching workbox-window
```

**Version verification:** All versions verified against npm registry on 2026-05-09.

## Architecture Patterns

### System Architecture Diagram

```
[User opens PWA from Home Screen]
         |
         v
[iOS renders standalone app]
         |
         v
[index.html loads] --> [<meta> tags: apple-mobile-web-app-*, viewport-fit=cover]
         |
         v
[Service Worker activates]
         |
         +--> [Precache: all JS/CSS/HTML/icons from build]
         |
         v
[React app mounts]
         |
         v
[SwipeContainer (CSS scroll-snap)]
         |
    +---------+---------+
    |         |         |
    v         v         v
[Landing]  [Breathing] [Meditation]
  Panel      Panel       Panel
         |
         v
[PageDots component] -- observes scroll position --> updates active dot
```

### Recommended Project Structure
```
mindfulone/
├── public/
│   ├── pwa-192x192.png        # Placeholder icon
│   ├── pwa-512x512.png        # Placeholder icon
│   ├── apple-touch-icon.png   # 180x180 iOS icon
│   └── favicon.ico            # Browser tab icon
├── src/
│   ├── components/
│   │   ├── SwipeContainer.tsx  # CSS scroll-snap 3-panel layout
│   │   ├── PageDots.tsx        # Navigation indicator dots
│   │   ├── LandingScreen.tsx   # Brand/logo screen
│   │   ├── BreathingScreen.tsx # Static circle placeholder
│   │   └── MeditationScreen.tsx# Text placeholder
│   ├── App.tsx                 # Root component
│   ├── App.css                 # Tailwind imports + safe area styles
│   ├── main.tsx                # React entry point
│   └── vite-env.d.ts          # Vite type declarations
├── index.html                  # HTML entry with iOS meta tags
├── vite.config.ts              # Vite + Tailwind + PWA plugins
├── tsconfig.json               # TypeScript config
├── tsconfig.app.json           # App-specific TS config
└── package.json
```

### Pattern 1: CSS Scroll-Snap Swipe Container
**What:** Use native CSS scroll-snap for horizontal panel navigation
**When to use:** When panels are full-viewport-width and need native iOS momentum scrolling
**Example:**
```typescript
// Source: MDN CSS scroll-snap-type + verified iOS Safari 11+ support
// SwipeContainer.tsx
import { useRef, useCallback, type ReactNode } from 'react';

interface SwipeContainerProps {
  children: ReactNode;
  onPageChange: (index: number) => void;
}

export function SwipeContainer({ children, onPageChange }: SwipeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    onPageChange(index);
  }, [onPageChange]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex w-screen h-dvh overflow-x-auto snap-x snap-mandatory scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      {children}
    </div>
  );
}

// Each panel:
// <div className="w-screen h-dvh flex-shrink-0 snap-start snap-always">
```

### Pattern 2: iOS PWA Meta Tags in index.html
**What:** Required meta tags for iOS standalone mode with safe areas
**When to use:** Always — these are mandatory for iOS PWA
**Example:**
```html
<!-- Source: Apple Developer docs + WebKit blog on iPhone X safe areas -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="buho">
<meta name="theme-color" content="#000000">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

### Pattern 3: Safe Area CSS with Tailwind
**What:** Apply safe area insets to prevent content from being hidden behind notch/home indicator
**When to use:** On the outermost container of the app
**Example:**
```css
/* Source: WebKit blog - Designing Websites for iPhone X */
/* In App.css or global styles */
@import "tailwindcss";

html, body {
  background-color: #000000;
  overflow: hidden;
}

.safe-area-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### Pattern 4: vite-plugin-pwa Configuration for iOS
**What:** Complete PWA plugin config with manifest and workbox
**When to use:** In vite.config.ts
**Example:**
```typescript
// Source: Context7 /vite-pwa/vite-plugin-pwa - verified configuration
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'mindfulONE',
        short_name: 'buho',
        description: 'Guided breathing and meditation',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
```

### Anti-Patterns to Avoid
- **Using `100vh` instead of `100dvh`:** On iOS Safari, `100vh` does not account for the dynamic toolbar. Use `100dvh` (dynamic viewport height) which adjusts when the URL bar appears/disappears. Tailwind class: `h-dvh`.
- **Forgetting `viewport-fit=cover`:** Without this meta tag, `env(safe-area-inset-*)` values are always 0. Content will not extend behind the status bar.
- **Setting `overflow: scroll` on body:** This causes iOS rubber-banding on the page itself. Use `overflow: hidden` on body and let the scroll-snap container handle its own scrolling.
- **Separate maskable and any icons:** The `purpose: 'any maskable'` combined value is deprecated. Use separate icon entries for `any` (default) and `maskable`.
- **Omitting `apple-mobile-web-app-capable`:** Even with a manifest `display: standalone`, iOS still requires this meta tag for fullscreen behavior.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker | Custom SW with fetch handlers | vite-plugin-pwa generateSW | Workbox handles cache versioning, cleanup, routing |
| Manifest injection | Manual manifest.json in public/ | vite-plugin-pwa manifest config | Plugin handles hashing, link injection, validation |
| Build tooling | Custom webpack/rollup config | Vite + plugins | Vite provides HMR, chunking, asset handling out of the box |
| CSS utilities | Custom utility classes | Tailwind CSS 4 | Purged utilities with dark mode, responsive, and state variants |
| Horizontal snapping | Custom touch event math | CSS scroll-snap | Browser-native momentum, 60fps, handles edge cases |

**Key insight:** This phase is entirely solved by well-configured tooling. The custom code is minimal — just React components for layout and content. All PWA complexity lives in configuration, not application code.

## Common Pitfalls

### Pitfall 1: iOS White Flash on Launch
**What goes wrong:** Users see a white flash when opening the PWA from home screen before the black background renders.
**Why it happens:** The browser shows the default white background color before CSS loads.
**How to avoid:** Set `background_color: '#000000'` in manifest AND set `background-color: #000000` directly on `<html>` and `<body>` elements inline in index.html (not via CSS file that must load first).
**Warning signs:** Testing only in browser; the flash only shows when launching from home screen.

### Pitfall 2: Service Worker Caching Stale Assets
**What goes wrong:** After deploying an update, the old version persists until the SW updates.
**Why it happens:** Service worker lifecycle — new SW installs but doesn't activate until all tabs close.
**How to avoid:** Use `registerType: 'autoUpdate'` which sets `skipWaiting: true` and `clientsClaim: true`. The new SW activates immediately.
**Warning signs:** User reports app looks outdated; clearing cache fixes it.

### Pitfall 3: Safe Area Insets Not Applied
**What goes wrong:** Content still hidden behind notch or home indicator despite using `env()`.
**Why it happens:** Missing `viewport-fit=cover` in the viewport meta tag. Without it, the browser does not expose safe area values.
**How to avoid:** Ensure viewport meta includes `viewport-fit=cover`. Test on actual iOS device (simulator may not show realistic safe areas).
**Warning signs:** `env(safe-area-inset-top)` evaluates to 0 in DevTools.

### Pitfall 4: Scroll-Snap Scroll Event Flooding
**What goes wrong:** The `onScroll` handler fires dozens of times during a swipe, causing re-renders.
**Why it happens:** Native scroll events fire at high frequency during momentum scrolling.
**How to avoid:** Debounce the page index calculation or use `scrollend` event (supported in Safari 18+). For older iOS, use a simple comparison: only call `onPageChange` when the calculated index actually changes.
**Warning signs:** React DevTools shows excessive re-renders during swipe.

### Pitfall 5: iOS PWA Not Offering "Add to Home Screen"
**What goes wrong:** Safari shows no install prompt or the app doesn't install correctly.
**Why it happens:** Missing or malformed manifest, icons not at required sizes, or serving over HTTP.
**How to avoid:** Manifest must have `name`, `short_name`, `start_url`, `display: standalone`, and at least one 192x192 and one 512x512 icon. Must be served over HTTPS (Vercel handles this).
**Warning signs:** Chrome Lighthouse PWA audit shows errors; testing only on desktop.

### Pitfall 6: Overscroll Bounce on iOS
**What goes wrong:** The entire page bounces when swiping past the first or last panel.
**Why it happens:** iOS Safari applies elastic overscroll by default.
**How to avoid:** Apply `overscroll-behavior: none` on the scroll-snap container. This prevents the elastic bounce at the edges.
**Warning signs:** Visible rubber-banding when swiping at the edges.

## Code Examples

### Complete index.html for iOS PWA
```html
<!-- Source: Apple Developer docs + vite-plugin-pwa docs -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#000000" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="buho" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="icon" href="/favicon.ico" />
    <title>mindfulONE</title>
    <style>
      /* Prevent white flash on iOS PWA launch */
      html, body { background-color: #000000; margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### PageDots Component
```typescript
// Source: UI-SPEC design contract
interface PageDotsProps {
  total: number;
  active: number;
}

export function PageDots({ total, active }: PageDotsProps) {
  return (
    <div
      role="tablist"
      aria-label="Navigation"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          role="tab"
          aria-selected={i === active}
          aria-label={['Landing', 'Breathing', 'Meditation'][i]}
          className={`w-2 h-2 rounded-full transition-opacity duration-200 ${
            i === active ? 'bg-white' : 'bg-[#666666]'
          }`}
        />
      ))}
    </div>
  );
}
```

### Tailwind CSS 4 Global Styles
```css
/* src/App.css */
@import "tailwindcss";

/* Safe area utilities via Tailwind v4 @theme */
@theme {
  --color-surface: #000000;
  --color-muted: #666666;
  --color-accent: #ffffff;
}

/* Prevent iOS overscroll on the main scroll container */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: none;
  scrollbar-width: none;
}

.scroll-container::-webkit-scrollbar {
  display: none;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js | CSS @theme directive | Tailwind v4 (Jan 2025) | No config file needed, all in CSS |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 (Jan 2025) | Single import replaces three directives |
| PostCSS plugin for Tailwind | @tailwindcss/vite plugin | Tailwind v4 (Jan 2025) | Faster builds, native Vite integration |
| `100vh` for fullscreen | `100dvh` (dynamic viewport height) | Safari 15.4 (2022) | Accounts for dynamic toolbar on iOS |
| `constant(safe-area-inset-*)` | `env(safe-area-inset-*)` | iOS 11.2 (2017) | Old `constant()` syntax deprecated |
| `purpose: 'any maskable'` combined | Separate icon entries per purpose | 2023 convention | Combined value deprecated in spec |
| Manual service worker | vite-plugin-pwa generateSW | Stable since 2022 | Eliminates hand-written SW maintenance |

**Deprecated/outdated:**
- `@tailwind base; @tailwind components; @tailwind utilities;` — replaced by `@import "tailwindcss"` in v4
- `tailwind.config.js` — replaced by CSS `@theme {}` directive in v4
- `constant(safe-area-inset-*)` — old iOS 11.0-11.1 syntax, use `env()` instead
- `purpose: 'any maskable'` — split into separate icon entries

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | iOS Safari in standalone mode respects `orientation: portrait` in manifest | Architecture Patterns | Low — app works fine in landscape, just not locked. Can add CSS orientation media query as backup |
| A2 | `scrollend` event available in Safari 18+ | Common Pitfalls (Pitfall 4) | Low — fallback approach (index comparison) works universally |
| A3 | Vercel free tier has no bandwidth limit that would affect a simple static PWA | Deployment | Very low — meditation app has negligible traffic |

## Open Questions

1. **Placeholder icons format**
   - What we know: Need 192x192, 512x512, and 180x180 (apple-touch-icon) PNG files
   - What's unclear: Should placeholders be solid black squares, or have minimal branding?
   - Recommendation: Use solid black PNG with a subtle border or a simple placeholder shape. User will replace later per D-11.

2. **CSS scroll-snap vs react-swipeable for dot synchronization**
   - What we know: CSS scroll-snap gives native performance; react-swipeable gives fine-grained JS control
   - What's unclear: Whether scroll event listening is reliable enough for dot state on older iOS
   - Recommendation: Start with CSS scroll-snap + scroll event listener. The `Math.round(scrollLeft / clientWidth)` approach is reliable. Fall back to react-swipeable only if testing reveals issues.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tooling | Yes | v25.8.2 | -- |
| npm | Package management | Yes | 11.11.1 | -- |
| Vite | Dev server + build | Yes (via npx) | 8.0.11 | -- |
| HTTPS (Vercel) | PWA requirement | Yes (on deploy) | -- | -- |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PWA-01 | Manifest has required fields for iOS installability | unit | `npx vitest run src/__tests__/manifest.test.ts -t "manifest"` | No -- Wave 0 |
| PWA-02 | Service worker precaches all static assets | smoke | `npx vitest run src/__tests__/sw.test.ts` | No -- Wave 0 |
| PWA-03 | HTML has standalone meta tags | unit | `npx vitest run src/__tests__/meta-tags.test.ts` | No -- Wave 0 |
| PWA-04 | Layout uses safe area env variables | unit | `npx vitest run src/__tests__/safe-area.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration with jsdom environment
- [ ] `src/__tests__/manifest.test.ts` -- Validates manifest fields match PWA-01 requirements
- [ ] `src/__tests__/meta-tags.test.ts` -- Validates index.html has correct iOS meta tags
- [ ] `src/__tests__/safe-area.test.ts` -- Validates safe area CSS is applied to container
- [ ] `src/__tests__/sw.test.ts` -- Validates SW config includes correct glob patterns
- [ ] Framework install: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A -- no user accounts |
| V3 Session Management | No | N/A -- no sessions |
| V4 Access Control | No | N/A -- no protected resources |
| V5 Input Validation | No | N/A -- no user input in Phase 1 |
| V6 Cryptography | No | N/A -- no secrets or encryption |

### Known Threat Patterns for Static PWA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Service worker cache poisoning | Tampering | HTTPS-only (Vercel enforces), versioned cache names |
| Manifest manipulation via MITM | Tampering | HTTPS-only serving |
| XSS via injected content | Tampering | N/A in Phase 1 (no dynamic content or user input) |

**Note:** Phase 1 has minimal attack surface -- it is a static shell with no user input, no backend, and no dynamic content. Security concerns increase in later phases (audio loading, localStorage).

## Sources

### Primary (HIGH confidence)
- Context7 `/vite-pwa/vite-plugin-pwa` -- PWA configuration, React integration, workbox setup
- Context7 `/formidablelabs/react-swipeable` -- useSwipeable API reference
- Context7 `/websites/vite-pwa-org_netlify_app` -- iOS splash screens, meta tag requirements
- npm registry (direct queries) -- All package versions verified 2026-05-09
- [CITED: developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html] -- apple-mobile-web-app meta tags
- [CITED: webkit.org/blog/7929/designing-websites-for-iphone-x/] -- viewport-fit=cover, env(safe-area-inset-*)
- [CITED: tailwindcss.com/blog/tailwindcss-v4] -- Tailwind v4 CSS-first configuration
- [CITED: developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type] -- CSS scroll-snap specification
- [CITED: caniuse.com/css-snappoints] -- iOS Safari scroll-snap support since v11

### Secondary (MEDIUM confidence)
- [CITED: caniuse.com/screen-orientation] -- Screen Orientation API iOS 16.4+

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified against npm, well-established libraries
- Architecture: HIGH -- CSS scroll-snap + vite-plugin-pwa are documented, mature solutions
- Pitfalls: HIGH -- Based on official Apple/WebKit documentation and known iOS behaviors

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (stable ecosystem, 30-day validity)
