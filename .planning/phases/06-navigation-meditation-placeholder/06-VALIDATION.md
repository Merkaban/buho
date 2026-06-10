---
phase: 6
slug: navigation-meditation-placeholder
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Filled by gsd-planner; this draft is scaffolded from RESEARCH.md §"Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.5 + jsdom 29 + React Testing Library |
| **Config file** | vite.config.ts (test block) |
| **Quick run command** | `npx vitest run --changed` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~{TBD by planner} seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --changed`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds (target — planner to confirm against measured runtime)

---

## Per-Task Verification Map

*Planner fills this in when PLAN.md tasks are written. One row per task.*

---

## Wave 0 Requirements

- [ ] `tests/lib/meditationsDB.test.ts` — IndexedDB wrapper unit tests (jsdom IDB stubs)
- [ ] `tests/hooks/useMeditationPlayer.test.ts` — Howler interaction tests with mocked Howl
- [ ] `tests/components/MeditationLibrary.test.tsx` — empty state, populated list, delete-row interaction
- [ ] `tests/components/MeditationPlayer.test.tsx` — play/pause/stop/auto-stop on end + wake-lock activate/release calls

*Existing infrastructure (vitest + jsdom + RTL) is sufficient — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| iOS Files-sheet surfaces audio/* | MEDT-* (upload) | Real iOS device behavior (Files app, iCloud Drive, Voice Memos export) cannot be reproduced in jsdom | On installed PWA: tap Add meditation → confirm Files app + iCloud Drive options appear → upload an .m4a from Voice Memos → confirm row appears |
| Howler + Blob URL playback on iOS | MEDT-* (player) | iOS Safari audio quirks (autoplay, Web Audio context state) only manifest on real device | On installed PWA: play uploaded meditation → confirm audio audible → pause/resume → confirm correct elapsed time → stop → confirm returns to library |
| Wake lock active during playback | MEDT-* (wake lock) | Screen-lock behavior cannot be observed in tests | On installed PWA: start playback → leave device idle past auto-lock timeout → confirm screen stays awake → stop → confirm screen locks normally |
| IndexedDB persistence across reload | MEDT-* (persist) | Real browser/PWA persistence with quota & 7-day eviction is environmental | Upload 1+ meditation → close PWA → reopen → confirm meditation still listed and playable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
