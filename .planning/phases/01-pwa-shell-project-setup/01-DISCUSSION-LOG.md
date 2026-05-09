# Phase 1: PWA Shell & Project Setup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 1-PWA Shell & Project Setup
**Areas discussed:** Deployment platform, App shell appearance, PWA identity

---

## Deployment Platform

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel (Recommended) | Free tier, auto-deploys from Git, instant HTTPS, great for PWAs | ✓ |
| Netlify | Very similar to Vercel — free tier, auto-deploy, HTTPS | |
| GitHub Pages | Free, simple, but manual deploy steps | |

**User's choice:** Vercel
**Notes:** User will handle Vercel setup themselves — no deployment instructions needed in plan.

| Option | Description | Selected |
|--------|-------------|----------|
| Default Vercel URL | Use yourproject.vercel.app | ✓ |
| Custom domain | Point a domain at this | |

**User's choice:** Default Vercel URL

---

## App Shell Appearance

| Option | Description | Selected |
|--------|-------------|----------|
| Just the breathing circle | Static white circle centered on dark background | |
| App name + circle | "mindfulONE" text at top, circle below | |
| Blank dark screen | Pure black with nothing visible | |

**User's choice:** (Free text) App name with logo on first screen. Swipe once for breathing screen with circle and config for inhale/hold/exhale seconds and music mute toggle.
**Notes:** User envisions a 3-screen swipeable structure — this redefines the shell to include full navigation from Phase 1.

| Option | Description | Selected |
|--------|-------------|----------|
| 3 swipeable screens | Landing → Breathing → Meditation — all in swipeable container | ✓ |
| Landing is separate | Landing page is splash-like, then 2-screen swipeable | |
| No landing page | Opens directly to breathing screen | |

**User's choice:** 3 swipeable screens

| Option | Description | Selected |
|--------|-------------|----------|
| All 3 panels now | Scaffold swipeable container with 3 placeholder panels in Phase 1 | ✓ |
| Landing only | Build just landing screen, swipe container comes in Phase 6 | |

**User's choice:** All 3 panels now

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, dots (Recommended) | Small dots at bottom showing position | ✓ |
| No indicators | Rely on user knowing they can swipe | |

**User's choice:** Yes, page indicator dots

---

## PWA Identity

| Option | Description | Selected |
|--------|-------------|----------|
| mindfulONE | Full name (10 chars, fits iOS) | |
| mindful | Shorter, no truncation risk | |
| mONE | Abbreviated | |

**User's choice:** (Free text) "buho" — owl in Spanish
**Notes:** Home screen icon label will be "buho" while full app name remains "mindfulONE"

| Option | Description | Selected |
|--------|-------------|----------|
| Pure black (#000000) | Status bar blends seamlessly with dark UI | ✓ |
| Dark gray (#1a1a1a) | Slightly softer than pure black | |

**User's choice:** Pure black (#000000)

| Option | Description | Selected |
|--------|-------------|----------|
| I'll provide an icon | User has/will make specific icon | ✓ |
| Placeholder for now | Simple generated icon | |
| SVG owl | Create simple SVG owl to match "buho" | |

**User's choice:** Will provide icon — plan should include placeholder slots at required sizes

---

## Claude's Discretion

None — user made all decisions explicitly.

## Deferred Ideas

None — discussion stayed within phase scope.
