import { useReducer } from 'react';
import { BreathingCircle } from './BreathingCircle';
import { TimingControls } from './TimingControls';
import { useBreathingAnimation, breathingReducer } from '../hooks/useBreathingAnimation';
import { DEFAULT_CONFIG } from '../types/breathing';
import type { BreathingState } from '../types/breathing';

const initialState: BreathingState = {
  session: 'idle',
  config: { ...DEFAULT_CONFIG },
};

export function BreathingScreen() {
  const [state, dispatch] = useReducer(breathingReducer, initialState);
  const { elementRef, start, stop } = useBreathingAnimation();

  const handleCircleTap = () => {
    if (state.session === 'idle') {
      dispatch({ type: 'START' });
      start(state.config);
    } else {
      dispatch({ type: 'STOP' });
      stop();
    }
  };

  return (
    <div
      data-panel="breathing"
      data-session={state.session}
      aria-label="Breathing"
      className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex items-center justify-center bg-black relative"
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
    </div>
  );
}
