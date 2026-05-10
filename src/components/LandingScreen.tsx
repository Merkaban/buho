export function LandingScreen() {
  return (
    <div
      data-panel="landing"
      aria-label="Landing"
      className="w-screen h-dvh flex-shrink-0 snap-start snap-always flex flex-col items-center justify-center bg-[#5f7d60]"
    >
      {/* Logo placeholder slot: 64x64, invisible when no image per UI-SPEC */}
      <div className="w-16 h-16 mb-12" aria-hidden="true" />
      <h1 className="text-[32px] font-extralight leading-tight text-white">
        mindfulONE
      </h1>
    </div>
  );
}
