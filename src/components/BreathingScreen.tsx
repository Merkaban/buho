import { useReducer, useEffect } from 'react';
import { BreathingCircle } from './BreathingCircle';
import { TimingControls } from './TimingControls';
import { MusicToggle } from './MusicToggle';
import { useBreathingAnimation, breathingReducer } from '../hooks/useBreathingAnimation';
import { useBreathingAudio } from '../hooks/useBreathingAudio';
import { useWakeLock } from '../hooks/useWakeLock';
import { loadSettings, saveSettings } from '../hooks/useSettings';
import type { BreathingState } from '../types/breathing';

const initialState: BreathingState = {
  session: 'idle',
  ...loadSettings(),
};

export function BreathingScreen() {
  const [state, dispatch] = useReducer(breathingReducer, initialState);
  const { elementRef, start, stop } = useBreathingAnimation();
  const { start: audioStart, stop: audioStop, toggleMusic } = useBreathingAudio();
  const { activate: wakeLockActivate, release: wakeLockRelease } = useWakeLock();

  useEffect(() => {
    const timer = setTimeout(() => {
      saveSettings(state.config, state.musicEnabled);
    }, 500);
    return () => clearTimeout(timer);
  }, [state.config, state.musicEnabled]);

  const handleCircleTap = () => {
    if (state.session === 'idle') {
      dispatch({ type: 'START' });
      start(state.config);
      audioStart(state.config); // D-08: starts music + schedules cues, D-11: iOS unlock via gesture
      wakeLockActivate();
    } else {
      dispatch({ type: 'STOP' });
      stop();
      audioStop(); // D-10: cuts all audio immediately
      wakeLockRelease();
    }
  };

  const handleMusicToggle = () => {
    const newEnabled = !state.musicEnabled;
    dispatch({ type: 'TOGGLE_MUSIC' });
    toggleMusic(newEnabled); // D-03: immediate cut, D-04: mute preserves position
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
      <MusicToggle
        enabled={state.musicEnabled}
        onToggle={handleMusicToggle}
      />
    </div>
  );
}
