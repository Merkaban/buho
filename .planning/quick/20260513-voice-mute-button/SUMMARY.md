---
status: complete
---

# Voice Mute Button — Complete

Added a voice mute button positioned above the music toggle button. Uses a microphone icon to clearly distinguish it from the speaker/music button below.

## Implementation

- **VoiceToggle component** (`src/components/VoiceToggle.tsx`): Microphone icon with slash-through when muted
- **State**: Added `voiceEnabled` to `BreathingState` with `TOGGLE_VOICE` action
- **Audio**: Uses Howler's `.mute()` on cue instances — scheduling continues so unmuting stays in sync
- **Persistence**: `voiceEnabled` saved/loaded via localStorage settings
- **Session start**: If voice was previously muted, applies mute state when starting a new session

## Files Changed

- `src/types/breathing.ts` — added `voiceEnabled` field and `TOGGLE_VOICE` action
- `src/hooks/useBreathingAnimation.ts` — added reducer case for `TOGGLE_VOICE`
- `src/hooks/useBreathingAudio.ts` — added `toggleVoice` function
- `src/hooks/useSettings.ts` — persist/load `voiceEnabled`
- `src/components/VoiceToggle.tsx` — new component
- `src/components/BreathingScreen.tsx` — wired up voice toggle
