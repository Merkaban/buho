import { forwardRef } from 'react';
import type { SessionState } from '../types/breathing';

interface BreathingCircleProps {
  session: SessionState;
  onClick: () => void;
}

export const BreathingCircle = forwardRef<HTMLDivElement, BreathingCircleProps>(
  function BreathingCircle({ session, onClick }, ref) {
    const isIdle = session === 'idle';

    return (
      <div
        ref={ref}
        data-testid="breathing-circle"
        role="button"
        aria-label={isIdle ? 'Start breathing session' : 'Stop breathing session'}
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
        className={`w-12 h-12 rounded-full bg-[#f5f0eb] cursor-pointer transition-shadow duration-300 ${
          isIdle
            ? 'shadow-[0_0_30px_8px_rgba(245,240,235,0.6)]'
            : 'shadow-none'
        }`}
        style={{ transformOrigin: 'center', willChange: 'transform' }}
      />
    );
  }
);
