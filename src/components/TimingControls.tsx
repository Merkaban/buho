import type { BreathingConfig, BreathingAction } from '../types/breathing';
import { MIN_SECONDS, MAX_SECONDS, MIN_DURATION, MAX_DURATION } from '../types/breathing';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
}

function Stepper({ label, value, min, max, onChange, suffix }: StepperProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-white/60 text-xs uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-white/30 text-white flex items-center justify-center disabled:opacity-30 active:bg-white/10"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className={`text-white text-lg text-center tabular-nums ${suffix ? 'w-12' : 'w-6'}`}>
          {value}{suffix && <span className="ml-0.5">{suffix}</span>}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-white/30 text-white flex items-center justify-center disabled:opacity-30 active:bg-white/10"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

interface TimingControlsProps {
  config: BreathingConfig;
  dispatch: React.Dispatch<BreathingAction>;
  visible: boolean;
}

export function TimingControls({ config, dispatch, visible }: TimingControlsProps) {
  return (
    <div
      data-testid="timing-controls"
      className={`absolute top-[15%] left-0 right-0 px-4 flex flex-col items-center transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      <div className="flex justify-center gap-3 sm:gap-6">
        <Stepper
          label="inhale"
          value={config.inhale}
          min={MIN_SECONDS.inhale}
          max={MAX_SECONDS.inhale}
          onChange={(v) => dispatch({ type: 'SET_INHALE', value: v })}
        />
        <Stepper
          label="hold in"
          value={config.holdIn}
          min={MIN_SECONDS.holdIn}
          max={MAX_SECONDS.holdIn}
          onChange={(v) => dispatch({ type: 'SET_HOLD_IN', value: v })}
        />
        <Stepper
          label="exhale"
          value={config.exhale}
          min={MIN_SECONDS.exhale}
          max={MAX_SECONDS.exhale}
          onChange={(v) => dispatch({ type: 'SET_EXHALE', value: v })}
        />
        <Stepper
          label="hold out"
          value={config.holdOut}
          min={MIN_SECONDS.holdOut}
          max={MAX_SECONDS.holdOut}
          onChange={(v) => dispatch({ type: 'SET_HOLD_OUT', value: v })}
        />
      </div>
      <div className="mt-8 flex justify-center">
        <Stepper
          label="duration"
          value={config.duration}
          min={MIN_DURATION}
          max={MAX_DURATION}
          onChange={(v) => dispatch({ type: 'SET_DURATION', value: v })}
          suffix="min"
        />
      </div>
    </div>
  );
}
