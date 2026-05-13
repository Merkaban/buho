---
slug: voice-mute-button
status: in-progress
created: 2026-05-13
---

# Voice Mute Button

Add a button above the music/speaker toggle that mutes voice cues only. The voice scheduling continues even when muted so that re-enabling voice stays in sync with the breathing circle.

## Tasks

1. Add `voiceEnabled` to BreathingState and a `TOGGLE_VOICE` action
2. Persist `voiceEnabled` in settings
3. Add `toggleVoice` to useBreathingAudio (mute Howl instances, keep scheduling)
4. Create `VoiceToggle` component with a voice-specific icon (speech bubble / person-speaking style)
5. Wire up in BreathingScreen above MusicToggle
