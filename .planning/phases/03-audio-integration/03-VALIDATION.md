---
phase: 3
slug: audio-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | BRTH-09 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | BRTH-10 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | BRTH-11 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | BRTH-12 | — | N/A | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/useBreathingAudio.test.ts` — stubs for BRTH-09, BRTH-10, BRTH-11
- [ ] `src/__tests__/musicToggle.test.ts` — stubs for BRTH-12

*Existing vitest infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audio plays on iOS Safari after tap | BRTH-09/10/11 | Requires real iOS device + speaker | 1. Open app on iOS Safari 2. Tap circle to start 3. Verify voice cues play at phase transitions |
| Background music loops on iOS | BRTH-12 | Requires real device audio output | 1. Enable music toggle 2. Start session 3. Wait for loop boundary — verify seamless loop |
| Audio works offline | BRTH-09/10/11/12 | Requires airplane mode test | 1. Load app 2. Enable airplane mode 3. Start session 4. Verify audio plays from cache |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
