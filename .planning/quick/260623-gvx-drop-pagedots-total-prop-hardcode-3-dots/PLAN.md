---
status: complete
task_id: 260623-gvx
slug: drop-pagedots-total-prop-hardcode-3-dots
created: 2026-06-23
completed: 2026-06-23
---

# Quick Task: Drop PageDots `total` prop, hardcode 3 dots

## Description

User locked the 3-panel structure as final (Landing / Breathing / Meditation). Phase 6 D-01 already states this explicitly, so the `PageDots.total` prop is yagni — it has one call site, always `3`. Drop the prop and render exactly 3 dots inline.

## Tasks

- [x] **T1** — Remove `total` from `PageDotsProps` in `src/components/PageDots.tsx`. Render 3 fixed dots (drop `Array.from({ length: total })`).
- [x] **T2** — Remove `total={3}` from `src/App.tsx:27`.
- [x] **T3** — Reword `.planning/phases/06-navigation-meditation-placeholder/06-UI-SPEC.md:392` from "already supports 3 dots (`total={3}`)" to "renders exactly 3 dots — locked by D-01".

## Verification

- `npm run build` — passes.
- `npm test` — 156/156 green (navigation.test.tsx counts rendered dots, doesn't reference the prop).
