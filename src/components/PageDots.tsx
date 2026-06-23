interface PageDotsProps {
  active: number;
}

export function PageDots({ active }: PageDotsProps) {
  return (
    <div
      role="group"
      aria-label="Navigation indicator"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`w-2 h-2 rounded-full transition-opacity duration-200 ${
            i === active ? 'bg-white' : 'bg-[#666666]'
          }`}
        />
      ))}
    </div>
  );
}
