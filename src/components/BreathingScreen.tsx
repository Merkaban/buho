import { useReducer, useEffect, useCallback, useRef } from 'react';
import { BreathingCircle } from './BreathingCircle';
import { TimingControls } from './TimingControls';
import { CountdownDisplay } from './CountdownDisplay';
import { MusicToggle } from './MusicToggle';
import { VoiceToggle } from './VoiceToggle';
import { useBreathingAnimation, breathingReducer } from '../hooks/useBreathingAnimation';
import { useBreathingAudio } from '../hooks/useBreathingAudio';
import { useWakeLock } from '../hooks/useWakeLock';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { loadSettings, saveSettings } from '../hooks/useSettings';
import type { BreathingState } from '../types/breathing';

const initialState: BreathingState = {
  session: 'idle',
  ...loadSettings(),
};

export function BreathingScreen() {
  const [state, dispatch] = useReducer(breathingReducer, initialState);
  const { elementRef, start, stop, stopAfterCycle } = useBreathingAnimation();
  const { start: audioStart, stop: audioStop, windDown, fadeMusic, toggleMusic, toggleVoice } = useBreathingAudio();
  const { activate: wakeLockActivate, release: wakeLockRelease } = useWakeLock();

  const handleAutoStop = useCallback(async () => {
    windDown();
    await stopAfterCycle();
    await fadeMusic(10000);
    dispatch({ type: 'STOP' });
    stop();
    wakeLockRelease();
  }, [windDown, stopAfterCycle, fadeMusic, stop, wakeLockRelease]);

  const { remaining, start: timerStart, clear: timerClear } = useSessionTimer(handleAutoStop);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveSettings(state.config, state.musicEnabled, state.voiceEnabled);
    }, 500);
    return () => clearTimeout(timer);
  }, [state.config, state.musicEnabled, state.voiceEnabled]);

  const handleCircleTap = () => {
    if (state.session === 'idle') {
      dispatch({ type: 'START' });
      start(state.config);
      audioStart(state.config);
      if (!state.voiceEnabled) toggleVoice(false);
      wakeLockActivate();
      timerStart(state.config.duration);
    } else {
      dispatch({ type: 'STOP' });
      stop();
      audioStop(); // D-10: cuts all audio immediately
      wakeLockRelease();
      timerClear();
    }
  };

  const handleMusicToggle = () => {
    const newEnabled = !state.musicEnabled;
    dispatch({ type: 'TOGGLE_MUSIC' });
    toggleMusic(newEnabled); // D-03: immediate cut, D-04: mute preserves position
  };

  const handleVoiceToggle = () => {
    const newEnabled = !state.voiceEnabled;
    dispatch({ type: 'TOGGLE_VOICE' });
    toggleVoice(newEnabled);
  };

  return (
    <div
      data-panel="breathing"
      data-session={state.session}
      aria-label="Breathing"
      className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex items-center justify-center bg-[#5f7d60] relative"
    >
      <TimingControls
        config={state.config}
        dispatch={dispatch}
        visible={state.session === 'idle'}
      />
      <BreathingCircle
        ref={elementRef}
        session={state.session}
        onClick={handleCircleTap}
      />
      <CountdownDisplay
        remainingSeconds={remaining}
        visible={state.session === 'running' && state.config.duration > 0}
      />
      <VoiceToggle
        enabled={state.voiceEnabled}
        onToggle={handleVoiceToggle}
      />
      <MusicToggle
        enabled={state.musicEnabled}
        onToggle={handleMusicToggle}
      />
    </div>
  );
}
