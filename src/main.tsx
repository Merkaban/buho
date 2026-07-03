import { bootLog } from './lib/bootLog';
import {
  registerBootAndCheckCrashLoop,
  renderSafeModeViewer,
} from './lib/safeBoot';

bootLog('main.tsx loaded');

const root = document.getElementById('root')!;

// Safe-boot gate MUST run before App's module graph is evaluated: eager imports
// or module-eval side effects in the App tree (IndexedDB, etc.) could crash
// first. Keep App behind a dynamic import so its graph stays out of safe mode.
const { inCrashLoop, count } = registerBootAndCheckCrashLoop();

if (inCrashLoop) {
  bootLog(`main.tsx SAFE MODE (crash count ${count})`);
  renderSafeModeViewer(root, count);
} else {
  void (async () => {
    const [{ StrictMode }, { createRoot }, { default: App }] = await Promise.all([
      import('react'),
      import('react-dom/client'),
      import('./App'),
    ]);

    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    bootLog('main.tsx render() returned');
  })();
}
