---
phase: 1
slug: pwa-shell-project-setup
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PWA-01 | — | N/A | integration | `npx vitest run src/__tests__/pwa-manifest.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | PWA-02 | — | N/A | integration | `npx vitest run src/__tests__/service-worker.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | PWA-03 | — | N/A | integration | `npx vitest run src/__tests__/safe-areas.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | PWA-04 | — | N/A | manual | Manual iOS device test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@testing-library/react` — install test framework
- [ ] `src/__tests__/pwa-manifest.test.ts` — manifest validation stubs
- [ ] `src/__tests__/service-worker.test.ts` — SW registration stubs
- [ ] `src/__tests__/safe-areas.test.ts` — viewport/safe-area stubs

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| iOS home screen install | PWA-04 | Requires physical iOS device with Safari | 1. Open deployed URL in Safari 2. Share > Add to Home Screen 3. Launch from home screen 4. Verify standalone mode (no browser chrome) |
| Offline capability | PWA-02 | Requires real network conditions | 1. Install PWA 2. Enable airplane mode 3. Launch app 4. Verify dark screen renders |
| Safe area handling | PWA-03 | Requires device with notch | 1. Launch on iPhone with notch 2. Verify no content behind notch/home indicator |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
