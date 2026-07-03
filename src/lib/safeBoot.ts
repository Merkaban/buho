// ponytail: safe-boot crash-loop viewer for the iOS PWA cold-start crash.
//
// On-device Web Inspector readback is impossible: every relaunch after the
// crash also crashes, so there is never a live app context to attach to, and
// attaching to the crash overlay throws "SecurityError: The operation is
// insecure" (opaque data: origin). So we display `buho-boot-log` ON SCREEN
// instead of relying on the inspector.
//
// Mechanism: count consecutive boots that never survived 5 seconds. Two
// crashed boots in a row (count >= 2) means we are in a crash loop, so we
// render the boot log into #root instead of mounting App. A boot that lives
// 5 s resets the counter to 0 (healthy).
//
// CAVEAT: if the crash happens before ANY JS runs (pre-JS death — iOS splash
// chain H5 / SW-activation H6 territory), this counter never increments and
// safe mode never triggers. In that case the crash overlay persists with no
// safe-mode screen even after 2+ relaunches — which is itself a diagnostic
// signal that the renderer dies before JS.
//
// Remove this module once the cold-start crash is fixed and a regression test
// guards it.
const COUNT_KEY = 'buho-crash-count';
const LOG_KEY = 'buho-boot-log';
const HEALTHY_MS = 5000;
const CRASH_LOOP_THRESHOLD = 2;

function readCount(): number {
  try {
    const raw = localStorage.getItem(COUNT_KEY);
    const n = raw == null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeCount(n: number): void {
  try {
    localStorage.setItem(COUNT_KEY, String(n));
  } catch {
    // localStorage may be unavailable (private mode, quota); swallow.
  }
}

function readLog(): string {
  try {
    return localStorage.getItem(LOG_KEY) ?? '(boot log empty)';
  } catch {
    return '(boot log unavailable — localStorage threw)';
  }
}

/**
 * Increment the crash counter, schedule a healthy-reset, and decide whether we
 * are in a crash loop. Returns the pre-increment count so the caller can decide
 * to render the safe-mode viewer instead of mounting App.
 *
 * Must be called at the very top of main.tsx, before App's module graph is
 * evaluated (App is gated behind a dynamic import for exactly this reason).
 */
export function registerBootAndCheckCrashLoop(): { inCrashLoop: boolean; count: number } {
  const priorCount = readCount();
  writeCount(priorCount + 1);

  // A boot that survives HEALTHY_MS is considered healthy — reset the counter.
  try {
    setTimeout(() => writeCount(0), HEALTHY_MS);
  } catch {
    // environments without setTimeout (shouldn't happen in a browser) — ignore.
  }

  return { inCrashLoop: priorCount >= CRASH_LOOP_THRESHOLD, count: priorCount };
}

/**
 * Render the boot log directly into #root using plain DOM (no React, so App's
 * module graph is never touched in safe mode). Shows the crash count and a
 * "Continue anyway" button that clears the counter and reloads.
 */
export function renderSafeModeViewer(root: HTMLElement, count: number): void {
  root.textContent = '';

  const heading = document.createElement('h1');
  heading.textContent = 'búho — safe boot';
  heading.style.cssText =
    'font:600 18px system-ui,sans-serif;color:#fff;margin:0 0 8px';

  const subtitle = document.createElement('p');
  subtitle.textContent = `Crash loop detected (${count} consecutive crashed boots). Boot log below.`;
  subtitle.style.cssText =
    'font:14px system-ui,sans-serif;color:#cdd;margin:0 0 12px';

  const pre = document.createElement('pre');
  pre.textContent = readLog();
  pre.style.cssText =
    'white-space:pre-wrap;word-break:break-word;font:12px ui-monospace,monospace;' +
    'color:#0f0;background:#000;padding:12px;border-radius:8px;margin:0 0 12px;' +
    'max-height:60vh;overflow:auto';

  const button = document.createElement('button');
  button.textContent = 'Continue anyway';
  button.style.cssText =
    'font:600 16px system-ui,sans-serif;color:#000;background:#cdd;' +
    'border:0;border-radius:8px;padding:12px 20px;width:100%';
  button.addEventListener('click', () => {
    writeCount(0);
    location.reload();
  });

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'box-sizing:border-box;min-height:100dvh;padding:24px 16px;' +
    'background:#5f7d60;font-family:system-ui,sans-serif';
  wrap.append(heading, subtitle, pre, button);

  root.append(wrap);
}
