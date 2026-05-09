import { useRef, useCallback, type ReactNode } from 'react';

interface SwipeContainerProps {
  children: ReactNode;
  onPageChange: (index: number) => void;
}

export function SwipeContainer({ children, onPageChange }: SwipeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastIndexRef = useRef(0);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== lastIndexRef.current) {
      lastIndexRef.current = index;
      onPageChangeRef.current(index);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="scroll-container flex w-screen h-dvh overflow-x-auto snap-x snap-mandatory"
    >
      {children}
    </div>
  );
}
