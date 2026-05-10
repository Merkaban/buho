interface CountdownDisplayProps {
  remainingSeconds: number;
  visible: boolean;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function CountdownDisplay({ remainingSeconds, visible }: CountdownDisplayProps) {
  return (
    <div
      data-testid="countdown-display"
      aria-hidden={!visible}
      aria-live={visible ? 'polite' : undefined}
      className={`absolute top-[calc(50%+140px)] left-0 right-0 text-center text-white/60 text-sm tabular-nums transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {visible ? formatTime(remainingSeconds) : ''}
    </div>
  );
}
