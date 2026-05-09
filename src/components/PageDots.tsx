interface PageDotsProps {
  total: number;
  active: number;
}

export function PageDots({ total, active }: PageDotsProps) {
  return (
    <div
      role="tablist"
      aria-label="Navigation"
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          role="tab"
          aria-selected={i === active}
          aria-label={['Landing', 'Breathing', 'Meditation'][i]}
          className={`w-2 h-2 rounded-full transition-opacity duration-200 ${
            i === active ? 'bg-white' : 'bg-[#666666]'
          }`}
        />
      ))}
    </div>
  );
}
