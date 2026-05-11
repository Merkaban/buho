export function LandingScreen() {
  return (
    <div
      data-panel="landing"
      aria-label="Landing"
      className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex flex-col items-center justify-center bg-[#5f7d60]"
    >
      <img src="/logo.jpg" alt="búho logo" className="w-40 h-40 rounded-2xl mb-8" />
      <h1 className="text-[32px] font-extralight leading-tight text-white">
        búho
      </h1>
    </div>
  );
}
