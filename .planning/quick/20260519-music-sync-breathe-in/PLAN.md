---
slug: music-sync-breathe-in
status: in-progress
created: 2026-05-19
---

# Sync meditation music restart to breathe-in phase

## Problem
Music uses Howl `loop: true` which restarts immediately when the track ends, regardless of breathing phase. This causes the music to drift out of sync with breathing.

## Solution
1. Remove `loop: true` from music Howl config
2. Add an `onend` callback that sets a `musicNeedsRestart` flag
3. In `scheduleCycle`, when triggering the breathe-in cue, check the flag and restart music
4. This ensures music always begins on a breathe-in, maintaining the same sync as initial start

## Files
- `src/hooks/useBreathingAudio.ts` — sole file to modify
