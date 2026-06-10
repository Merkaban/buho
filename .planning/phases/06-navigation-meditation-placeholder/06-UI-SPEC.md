---
phase: 6
slug: navigation-meditation-placeholder
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-10
---

# Phase 6 — UI Design Contract

> Visual and interaction contract for the three-panel swipeable layout finalization PLUS the new meditation library + minimal player. All decisions below extend the locked Phase 1–5 visual language. **No new colors. No new typography weights. No new component libraries.**

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Tailwind-only, established Phase 1) |
| Preset | not applicable |
| Component library | none (vanilla React + Tailwind utility classes) |
| Icon library | none — inline 24×24 SVG, `stroke-width: 2`, `stroke-linecap: round`, `stroke-linejoin: round` (matches `MusicToggle.tsx` / `VoiceToggle.tsx` convention) |
| Font | system stack (Tailwind default `font-sans`) — no custom font loaded; weight `font-extralight` (200) and `font-normal` (400) only |
| CSS framework | Tailwind CSS 4 with `@theme` tokens in `src/App.css` (`--color-surface: #5f7d60`, `--color-muted: #666666`, `--color-accent: #ffffff`) |

**Constraint:** All Phase 6 components must consume existing tokens or arbitrary values that match. Do not introduce a new token, font weight, or icon dependency.

---

## Spacing Scale

Declared values (Tailwind defaults — all multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px (`gap-1`, `mt-1`) | Inline label-to-value gap (already used in `Stepper`) |
| sm | 8px (`gap-2`, `p-2`) | Page dot gap, compact element spacing |
| md | 16px (`px-4`, `gap-4`) | List row vertical padding, default element spacing |
| lg | 24px (`gap-6`, `p-6`) | Section padding, between-row dividers (none, padding instead) |
| xl | 32px (`gap-8`, `right-8`, `bottom-8`) | Layout gaps, corner-button offset (matches existing toggles) |
| 2xl | 48px (`p-12`, `mt-12`) | Major section breaks (empty-state vertical centering region) |
| 3xl | 64px | Reserved — not used in Phase 6 |

**Exceptions:**
- 80px (`bottom-20` ≈ 5rem) — vertical offset of stacked corner button (mirrors `VoiceToggle` placement at `bottom-[calc(5rem+env(safe-area-inset-bottom))]`)
- Touch targets: every tap target is ≥44×44px (Apple HIG). Icon buttons use `w-10 h-10` (40px) with hit area extended via `p-2` padding when needed; list rows use ≥56px height (`min-h-14`).
- Safe-area: every absolute-positioned bottom element adds `env(safe-area-inset-bottom)` (matches existing `PageDots`, `MusicToggle`).

---

## Typography

All sizes already in use by Phases 1–5. **No new sizes introduced.**

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Caption / Label | 12px (`text-xs`) | 400 (`font-normal`) | 1.5 | Stepper labels (`uppercase tracking-wider`); list-row secondary metadata (duration) |
| Body / Time | 14px (`text-sm`) | 400 (`font-normal`) | 1.5 | Countdown display, player elapsed/total time, list-row filename, button label |
| Value / Title | 18px (`text-lg`) | 400 (`font-normal`) | 1.4 | Stepper value, player meditation title |
| Display | 32px (`text-[32px]`) | 200 (`font-extralight`) | 1.1 (`leading-tight`) | Reserved — landing only. **Not used in Phase 6.** |

**Weight inventory:** exactly 2 weights — `font-extralight` (200, landing display only) and `font-normal` (400, everything else). No `font-medium`, no `font-semibold`, no `font-bold` in Phase 6.

**Color-of-text scale (uses opacity, not new colors):**
- `text-white` — primary, active, playing state
- `text-white/70` — interactive but resting (icon buttons, secondary actions)
- `text-white/60` — labels, metadata, countdown
- `text-white/30` — disabled / placeholder
- `text-[#666666]` — muted placeholder copy on the panel itself (e.g. empty-state copy mirrors current `MeditationScreen` placeholder)

`tabular-nums` MUST be applied to every numeric time string (consistent with `CountdownDisplay`).

---

## Color

Sage-on-ivory palette locked by Phase 1 D-12/D-13. Phase 6 reuses without addition.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#5f7d60` (sage) | Panel background, all three swipeable panels |
| Secondary (30%) | `rgba(255,255,255,0.06–0.10)` (`bg-white/10` resting / `bg-white/15` pressed) | List rows on press, player play-button surface; very subtle elevation against sage |
| Accent (10%) | `#f5f0eb` (ivory) | Breathing circle (existing); meditation player's large play/pause control fill; active list-row "now playing" indicator dot |
| White (interactive) | `#ffffff` (`text-white`) | Primary text, primary icons, active page dot |
| Muted | `#666666` (`--color-muted`) | Empty-state copy, inactive page dots |
| Destructive | `#e08080` (`text-[#e08080]`) — soft sage-compatible coral, used at 70% opacity (`text-[#e08080]/70`) **only** on the trash icon and the destructive-confirmation accent | Trash icon stroke; "Delete" word in confirmation dialog. **Nowhere else.** |

**Accent reserved for (explicit list — never broaden):**
1. Breathing circle (existing, Phase 2)
2. Meditation player's large round play/pause control (background fill, ivory)
3. Active "now playing" 6px ivory dot inside the playing list row (when player is active in background — out of v1 scope but reserved)
4. Active page dot in `PageDots` (existing — `bg-white`, intentionally white not ivory; do not change)

**Color rules:**
- No new hex value may be introduced for any non-destructive UI element. If a designer-instinct says "we need a highlight color", use `bg-white/10` or opacity instead.
- Destructive coral `#e08080` is the single new color in Phase 6 and is reserved for trash icon + delete-confirmation only. It must not appear on any non-destructive surface.
- The 60/30/10 split is honored: sage dominates the canvas, white-with-opacity surfaces secondary, ivory + white are reserved sparingly for primary action targets.

---

## Component Inventory (Phase 6)

| Component | New / Reused | Purpose |
|-----------|--------------|---------|
| `MeditationScreen` | Rebuilt | Container — orchestrates library / player view |
| `MeditationLibrary` | New | Empty state OR populated list view |
| `MeditationListRow` | New | Single row: filename + duration + delete affordance |
| `MeditationPlayer` | New | Title, play/pause, elapsed/total, back |
| `AddMeditationButton` | New | File-picker trigger (hidden `<input type="file">`) |
| `DeleteConfirmDialog` | New | Lightweight inline confirmation (NOT a modal — see interactions) |
| `SwipeContainer` | Reused | No changes |
| `PageDots` | Reused | No visual change — already supports 3 dots |
| `useWakeLock` | Reused | Activated on play, released on pause/stop/end |

---

## Layout Contracts

### Three-Panel Navigation (NAV-01, NAV-02)

- Three panels in fixed order: Landing (0) → Breathing (1) → Meditation (2). Confirmed by D-01.
- `SwipeContainer` requires no visual change.
- `PageDots` requires no visual change. Position remains `bottom-8` + safe-area, 2px dots, 8px gap, white active / `#666666` inactive. Confirmed.
- Each panel root keeps `data-panel`, `aria-label`, `w-screen h-dvh`, `flex-shrink-0`, `snap-start snap-always`, `bg-[#5f7d60]` (already standard).

### Meditation Panel — Two View States

The Meditation panel renders ONE of two view states based on internal state. **Page dots always remain visible** (no full-screen takeover).

#### State A: Library (Empty)

Triggered when `meditations.length === 0`. Centered single-column.

```
┌───────────────────────────────┐
│                               │
│                               │
│                               │
│   No meditations yet          │  ← text-base text-white/60, centered
│   Add your first recording    │  ← text-sm text-[#666666], centered, mt-2
│                               │
│   [ + Add meditation ]        │  ← AddMeditationButton, mt-8
│                               │
│                               │
│             • • •             │  ← PageDots (panel 2 active)
└───────────────────────────────┘
```

- Vertical centering: `flex flex-col items-center justify-center`.
- Heading: `text-base font-normal text-white/60`, centered.
- Sub-line: `text-sm font-normal text-[#666666]`, centered, `mt-2`.
- Spacing between sub-line and button: `mt-8` (32px).
- No icon, no illustration. Quiet.

#### State B: Library (Populated)

Triggered when `meditations.length >= 1`. List view.

```
┌───────────────────────────────┐
│                               │  ← top safe-area + 16px
│  Meditations                  │  ← text-sm uppercase tracking-wider text-white/60, px-6, mb-4
│                               │
│  ┌─────────────────────────┐  │
│  │ morning_calm.mp3   12:34│  │  ← MeditationListRow
│  │ ─────────────────── 🗑  │  │
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │
│  │ evening_wind.mp3   08:12│  │
│  │ ─────────────────── 🗑  │  │
│  └─────────────────────────┘  │
│                               │
│   [ + Add meditation ]        │  ← Sticky bottom bar OR list-end button (locked: list-end, see below)
│                               │
│             • • •             │  ← PageDots
└───────────────────────────────┘
```

- Outer panel uses `flex flex-col` (NOT centered) so list scrolls naturally.
- Top header label: `Meditations` — `text-xs uppercase tracking-wider text-white/60`, padded `px-6 pt-4 pb-3`.
- List: `flex-1 overflow-y-auto`, `px-4`, vertical scroll within panel only (does NOT capture horizontal swipe — see Interaction Rules).
- `AddMeditationButton` placed **at the end of the list** (after the last row), with `mt-6 mb-24` spacing so it doesn't collide with PageDots. **Decision:** end-of-list (not FAB, not sticky top). Rationale below.

### Meditation Player

Replaces the library view in-place when a row is tapped. Entire panel re-renders to player; PageDots remain visible.

```
┌───────────────────────────────┐
│ ←                             │  ← Back chevron, top-left, text-white/70
│                               │
│                               │
│                               │
│   morning_calm                │  ← Title (filename without extension), text-lg text-white, centered, mb-3
│      02:14 / 12:34            │  ← Time, text-sm text-white/60 tabular-nums, centered
│                               │
│         ┌──────┐              │
│         │  ▶  │               │  ← Play/pause control, 96px ivory disc, centered
│         └──────┘              │
│                               │
│                               │
│             • • •             │  ← PageDots (still panel 2)
└───────────────────────────────┘
```

- Vertical layout: `flex flex-col items-center justify-center`.
- **Title:** `text-lg font-normal text-white text-center`, max-width `max-w-[80%]`, single line `truncate`. Strip the file extension from the filename for display (`morning_calm.mp3` → `morning_calm`). Underscores rendered as-is (no auto-replacement to spaces — this is the user's filename, respect it).
- **Time:** `text-sm font-normal text-white/60 tabular-nums text-center mt-3`. Format: `M:SS / M:SS` (matches existing `CountdownDisplay`). Always 2-digit seconds, minutes unpadded (e.g. `2:14 / 12:34`, `0:05 / 1:00`).
- **Play/Pause control:** 96×96px (`w-24 h-24`) ivory disc (`bg-[#f5f0eb]`), `rounded-full`, centered icon (32×32 sage `text-[#5f7d60]` stroke-2 SVG — play triangle when paused/idle, pause bars when playing). Soft glow when idle (paused) using existing pattern: `shadow-[0_0_30px_8px_rgba(245,240,235,0.4)]` — fades on `active:`. `mt-12` from time. **Touch target: 96px exceeds 44px minimum.**
- **Back affordance (D-14):** Top-left chevron icon, 40×40 hit area at `top-4 left-4` (plus `env(safe-area-inset-top)` padding). Icon: 24×24 stroke-2 left-chevron, `text-white/70 active:text-white`. `aria-label="Back to library"`. Tapping back: stops playback, releases wake lock, returns to library view.
- No seek bar, no skip buttons, no waveform, no animation. Confirmed by D-13.

### MeditationListRow Layout

```
┌─────────────────────────────────────────────────┐
│  morning_calm.mp3                       12:34   │  ← 56px min-height row
│  ─────────────────────────────────────────────  │  ← divider (white/10), full-width
└─────────────────────────────────────────────────┘
```

- Row container: `flex items-center justify-between min-h-14 px-4 py-3 cursor-pointer active:bg-white/5 transition-colors duration-150`.
- Filename (left): `text-sm font-normal text-white truncate flex-1 mr-4` — truncates with ellipsis if too long. Includes file extension (`.mp3`). User uploaded the file with that name; we honor it.
- Duration (right): `text-sm font-normal text-white/60 tabular-nums shrink-0` — formatted `M:SS` (locked — see "Time-format display" decision below).
- **Divider:** `border-b border-white/10`, full row width. Last row has `border-b-0`. No explicit list border.
- **No icons in the row.** No play arrow, no audio glyph. Tap target IS the row. Trash icon is delete-only (see Delete Affordance).
- **Active/playing row:** Out of scope for v1 — D-15 dictates the player closes and returns to library on natural end, so there's no "playing in background" state to indicate. **Locked: no active-row visual treatment in v1.** (Reserved hook: 6px ivory dot at the right edge for future use.)
- Tap action: `onClick` calls `onSelect(meditation.id)` — view transitions to Player. Touch target: 56px row height ≥ 44px minimum.

### Delete Affordance — Locked: Trash Icon (NOT swipe-to-delete)

**Decision:** trash icon button at the right edge of each row, visible at all times.

**Rationale:**
1. Swipe-to-delete on iOS would conflict with the horizontal panel swipe (the page swipe gesture is `SwipeContainer`'s native scroll-snap on the X axis). A row-level horizontal swipe would compete for the same gesture and create a fragile UX — exactly the failure mode D-19 says to address only if it surfaces. Pre-empting it by NOT introducing the conflict is safer.
2. iOS does support swipe-to-delete in native `UITableView`, but the web version requires a non-trivial gesture-detection library and would be the first such dependency in the codebase. CLAUDE.md explicitly avoids new gesture libs ("Why react-swipeable: Only need left/right swipe, no carousel features needed"). We don't have a library for this.
3. Visible trash icon is universally legible, accessible (real button with `aria-label`), and zero gesture conflict.

**Implementation:**
- Trash icon lives **inside** the row, right of the duration, in a distinct 40×40 button: `w-10 h-10 flex items-center justify-center text-[#e08080]/70 active:text-[#e08080] transition-colors`.
- Icon: 18×18 stroke-2 trash SVG (Feather/Lucide trash-2 shape — standard outlined trash can).
- Updated row layout: `[filename .... duration] [trash button]` — three flexbox children. Filename `flex-1`, duration `shrink-0 mr-2`, trash `shrink-0`.
- Tap on trash button must `event.stopPropagation()` so it doesn't trigger row's onSelect.
- Tap on trash opens inline confirmation (see Delete Confirmation below).

### Delete Confirmation — Inline, Not Modal

**Decision:** in-row confirmation, not a modal sheet.

When trash is tapped, the row collapses to a confirmation state for that row only:

```
┌─────────────────────────────────────────────────┐
│  Delete morning_calm.mp3?      Cancel   Delete  │  ← row swaps content
└─────────────────────────────────────────────────┘
```

- Same row height (56px min). `flex items-center justify-between px-4 py-3`.
- Question: `text-sm font-normal text-white truncate flex-1 mr-4`.
- "Cancel" button: `text-sm font-normal text-white/70 active:text-white px-3 py-2 min-w-11`.
- "Delete" button: `text-sm font-normal text-[#e08080] active:text-[#e08080]/80 px-3 py-2 min-w-11`. Destructive coral, but text-only (no fill, no border).
- Both buttons have hit areas ≥44×44 by combining `min-w-11 min-h-11` with padding.
- Confirmation auto-dismisses if user taps elsewhere (row outside, swipes panel, etc.) — same UX as iOS contextual menus.

**Rationale:** Modal sheets on iOS PWA are heavyweight (require backdrop, focus management, escape handling). Inline confirmation matches the calm minimal aesthetic and stays within row scope.

### AddMeditationButton — Locked Position: End of List

**Decision:** Rendered at the bottom of the populated list (after the final row), NOT a floating action button (FAB), NOT sticky-top, NOT sticky-bottom.

**Rationale:**
1. FAB would float over content and visually compete with `PageDots` at the bottom-center. Two distinct round controls in the bottom region creates clutter.
2. Sticky top would create a fixed header that fights with the panel's clean edge-to-edge sage canvas.
3. Sticky bottom would have the same crowding problem with PageDots.
4. End-of-list placement matches the natural reading flow: "browse my meditations, see end of list, see how to add another." This is the iOS Notes / Voice Memos pattern.
5. With only 1–10 meditations in typical use, the list rarely scrolls long enough to bury the button. If a user has many, scrolling to the end to add more is acceptable (and short).

**Visual:**
- Button container: `mt-6 mb-24 mx-4 flex justify-center` (the `mb-24` clears `PageDots` at `bottom-8`).
- Button itself: `inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white text-sm font-normal active:bg-white/10 transition-colors min-h-11` (44px touch target).
- Icon: 16×16 stroke-2 plus icon, `text-white`, before the label.
- Label copy: `Add meditation` (sentence case, no trailing punctuation — see Copywriting).
- Behind the button, a hidden `<input type="file" accept="audio/*" />` is triggered by `onClick`.

**In empty state, the same button is used** but vertically centered with the empty-state copy (see State A).

---

## Time-Format Display — Locked: `M:SS`

**Decision:** Always `M:SS` zero-padded seconds, unpadded minutes (e.g. `2:14`, `12:34`, `0:45`). For durations ≥ 60 minutes (rare), use `H:MM:SS`. **Not** `12 min`. **Not** `12:34 (12 min)`. Single format everywhere.

**Rationale:**
1. `CountdownDisplay` already uses `M:SS` (locked Phase 5). Consistency.
2. `M:SS` gives precise information without ambiguity. "12 min" is fine for length but useless during playback (where seconds matter).
3. Single format for both list duration and player elapsed/total simplifies the formatter — one shared utility.

**Shared formatter:** `formatTime(seconds: number): string` extracted to `src/lib/formatTime.ts` (or similar). Replaces the local `formatTime` in `CountdownDisplay.tsx`. Both Phase 5's countdown and Phase 6's library/player import from the same source.

---

## Interaction Rules

### Horizontal Swipe vs. Vertical List Scroll
- The library list scrolls vertically inside the panel.
- The panel itself scroll-snaps horizontally via `SwipeContainer`.
- Native browser behavior already handles this correctly: vertical scroll within an overflow-y container does not trigger horizontal panel snap. **No additional gesture management needed.** Confirmed by D-19.

### Tap-Through Prevention
- Trash button: `event.stopPropagation()` so deleting doesn't also trigger play.
- Add-meditation button: standard click; the hidden file input opens the iOS Files picker.
- Cancel/Delete confirmation buttons: `event.stopPropagation()`.

### Player Auto-Close
- D-15: When audio ends naturally, the player view tears down and the library view returns. Wake lock releases.
- D-16: Wake lock acquired via `useWakeLock.activate()` on play, released on pause, stop, back-tap, and natural end.

### Back Navigation
- Player back chevron: stops playback, releases wake lock, navigates view state to library. Does NOT navigate the panel (user is still on Meditation panel).
- Hardware back / browser back: not handled in v1 (PWA in standalone has no browser chrome). Future polish.

### Pause vs. Stop
- Tapping the play/pause control toggles play state but does NOT close the player. User remains on player view, can resume with another tap.
- Only the back chevron closes the player and returns to library.

### File-Picker Flow
1. User taps "Add meditation" → hidden `<input type="file" accept="audio/*">` triggered.
2. iOS Files / iCloud picker opens (native).
3. User selects ONE file (single-select, D-04). Cancel returns to library, no state change.
4. On selection: brief loading state on the row that's being added (or on the button) — `text-sm text-white/60` "Adding…" placeholder, replaced by the real row once duration is extracted and IndexedDB write completes.
5. Errors (unreadable file, IndexedDB full): inline error toast at the top of the list — `text-sm text-[#e08080]/80 px-4 py-2 mb-2 rounded bg-white/5`, dismisses on next user action or after 4 seconds.

---

## Copywriting Contract

All copy is sentence case, no trailing punctuation in headings/buttons, no emoji, no exclamation marks. Calm voice consistent with existing app.

| Element | Copy |
|---------|------|
| Library header (populated) | `Meditations` |
| Empty state heading | `No meditations yet` |
| Empty state body | `Add your first recording` |
| Primary CTA (add) | `Add meditation` |
| Adding-in-progress row | `Adding…` |
| File-picker error | `Could not read file` |
| Storage-full error | `Not enough storage` |
| Delete confirmation | `Delete {filename}?` (the literal filename including extension) |
| Cancel button | `Cancel` |
| Confirm-delete button | `Delete` |
| Player back button (aria-label only) | `Back to library` |
| Play button (aria-label, paused state) | `Play meditation` |
| Pause button (aria-label, playing state) | `Pause meditation` |
| Trash button (aria-label) | `Delete {filename}` |
| Add button (aria-label same as visible) | `Add meditation` |

**Voice rules:**
- No "Welcome to your library" or marketing copy. App is personal and quiet.
- No "Are you sure?" — the destructive action is obvious from the `Delete {filename}?` question.
- Times are read silently (no "12 minutes 34 seconds" announcement). `aria-label` on duration cells: `{filename}, {minutes} minutes {seconds} seconds` for screen reader clarity.

---

## Accessibility Contract

- All interactive elements use `<button>` (not `<div role="button">`) except where re-used components already do otherwise (none in Phase 6).
- Every button has a meaningful `aria-label` if its text alone isn't sufficient.
- Lists use semantic `<ul>` / `<li>`; rows are `<button>` inside `<li>` so screen readers announce list semantics + row purpose.
- Player time uses `aria-live="polite"` on the elapsed/total text node so updates are announced gently (mirrors existing `CountdownDisplay`).
- Color contrast: all `text-white/60` on `#5f7d60` ≥ 4.5:1 (verified Phase 1). `text-[#e08080]` on sage ≥ 3:1 for icon (large element exemption); coral text on sage ≥ 4.5:1 — verify during execution.
- Focus rings: rely on default `:focus-visible` + Tailwind's keyboard ring (consistent with existing buttons). Do not suppress.
- Reduced motion: no animations beyond existing 150–500ms color/opacity transitions. Already minimal — no `prefers-reduced-motion` branch needed.

---

## Reused Patterns — Visual Continuity Checklist

Implementer must mirror these existing-codebase conventions exactly:

- [ ] Bottom-corner buttons use `bottom-[calc(Nrem+env(safe-area-inset-bottom))] right-8`, `w-10 h-10`, `text-white/70 active:text-white transition-colors` (per `MusicToggle.tsx`).
- [ ] Steppers and similar controls use `border-white/30`, `disabled:opacity-30`, `active:bg-white/10` (per `TimingControls.tsx`).
- [ ] Time strings always use `tabular-nums` (per `CountdownDisplay.tsx`).
- [ ] All panels: `data-panel="<name>"`, `aria-label="<Title>"`, `w-screen h-dvh flex-shrink-0 snap-start snap-always bg-[#5f7d60]` (per `MeditationScreen.tsx`, `BreathingScreen.tsx`, `LandingScreen.tsx`).
- [ ] Transitions: `duration-150` for hover/press, `duration-300` for shadow, `duration-500` for fade — match existing.
- [ ] No new color tokens added to `App.css`. Only existing `--color-surface`, `--color-muted`, `--color-accent` plus arbitrary `[#f5f0eb]`, `[#e08080]` where needed.

---

## PageDots — Confirmed No Visual Change

The existing `PageDots` component already supports 3 dots (`total={3}`). Visual treatment locked Phase 1:
- 8×8px dots (`w-2 h-2`)
- 8px gap (`gap-2`)
- Active: `bg-white`
- Inactive: `bg-[#666666]`
- Position: `fixed bottom-8 left-1/2 -translate-x-1/2`, with `padding-bottom: env(safe-area-inset-bottom)`.

**No changes needed in Phase 6.** The component was built for 3 panels from day one.

The dots remain visible on all three panels INCLUDING the player view — they signal "you are still on the Meditation panel, the player is in-context." This reinforces D-13's minimal player principle: the player is not a fullscreen takeover, it's a view-state of the panel.

---

## Component Hierarchy (Reference)

```
App
├── SwipeContainer
│   ├── LandingScreen          (panel 0)
│   ├── BreathingScreen        (panel 1, unchanged)
│   └── MeditationScreen       (panel 2, REBUILT)
│       ├── view: 'library'
│       │   ├── MeditationLibrary (header + list OR empty state)
│       │   │   ├── MeditationListRow[] (or empty-state copy)
│       │   │   └── AddMeditationButton
│       │   └── DeleteConfirmInline (per-row, conditional)
│       └── view: 'playing'
│           └── MeditationPlayer (back, title, time, play/pause)
└── PageDots                    (unchanged)
```

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |
| Third-party | none | not applicable |

No design-system blocks introduced. All UI is hand-built Tailwind, consistent with the existing codebase pattern.

---

## Out-of-Scope Confirmations (sourced from CONTEXT.md `<deferred>`)

- No multi-file import.
- No editable titles, tags, descriptions.
- No seek bar, scrub, skip-back, skip-forward.
- No ambient animation during playback.
- No storage quota UI (beyond inline error if write fails).
- No URL fetch / paste-link import.
- No bundled starter content.
- No last-visited panel persistence — always opens to Landing (D-02).
- No active/playing row indicator in v1 (player closes on natural end, D-15).
- No swipe-to-delete (locked above).
- No modal dialogs (locked: inline confirmation).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
