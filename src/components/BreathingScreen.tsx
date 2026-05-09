export function BreathingScreen() {
  return (
    <div
      data-panel="breathing"
      aria-label="Breathing"
      className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex items-center justify-center bg-black"
    >
      <div
        data-testid="breathing-circle"
        className="w-[120px] h-[120px] rounded-full bg-white"
        aria-label="Breathing circle"
      />
    </div>
  );
}
