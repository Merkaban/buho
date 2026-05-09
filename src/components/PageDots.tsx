interface PageDotsProps {
  total: number;
  active: number;
}

export function PageDots({ total, active }: PageDotsProps) {
  return (
    <div
      role="group"
      aria-label="Navigation indicator"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {Array.from({ length: total }, (_, i) => (
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
