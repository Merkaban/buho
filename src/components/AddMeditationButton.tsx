import { useRef } from 'react';

interface AddMeditationButtonProps {
  onFile: (file: File) => void;
  // pending=true → label is `Adding…`, button is disabled, text is muted
  // (UI-SPEC line 331). The hook's `adding` state is wired to this in both
  // empty-state and list-end variants.
  pending?: boolean;
  // 'list-end' (default) wraps the button with `mt-6 mb-24 mx-4 flex justify-center`.
  // 'empty' returns just the button so the empty-state container can position it.
  variant?: 'empty' | 'list-end';
}

// Hidden file input + visible button (D-04, RESEARCH.md Pattern 5).
// D-05: there is no URL fetch path, no drag-drop handler, no bundled
// meditations — the picker is the only import surface.
export function AddMeditationButton({
  onFile,
  pending = false,
  variant = 'list-end',
}: AddMeditationButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (pending) return;
    inputRef.current?.click();
  };

  // Per UI-SPEC line 331, pending uses muted text + disabled. The default state
  // keeps text-white + active:bg-white/10. Visual is otherwise identical (same
  // pill, same border) so the layout doesn't shift between states.
  const buttonClass = pending
    ? 'inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-sm font-normal text-white/60 transition-colors min-h-11'
    : 'inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/30 text-white text-sm font-normal active:bg-white/10 transition-colors min-h-11';

  const buttonContent = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.wav,.aiff,.flac"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          // Pitfall 6: reset so re-picking the same file fires onChange again.
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={pending ? 'Adding meditation' : 'Add meditation'}
        className={buttonClass}
      >
        {pending ? null : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
        {pending ? 'Adding…' : 'Add meditation'}
      </button>
    </>
  );

  if (variant === 'empty') {
    return buttonContent;
  }
  return <div className="mt-6 mb-24 mx-4 flex justify-center">{buttonContent}</div>;
}
