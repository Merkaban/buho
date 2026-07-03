// ponytail: crash-survival breadcrumbs for the iOS PWA cold-start crash.
// Web Inspector console is empty pre-crash because the renderer dies before
// JS surfaces anything. localStorage persists across the kill, so we read it
// back on the recovery launch via `localStorage.getItem('buho-boot-log')`.
// Remove this file once the cold-start crash is fixed and a regression test
// covers it.
const KEY = 'buho-boot-log';

export function bootLog(msg: string): void {
  try {
    const prev = localStorage.getItem(KEY) ?? '';
    localStorage.setItem(KEY, `${prev}${Date.now()} ${msg}\n`);
  } catch {
    // localStorage may be unavailable (private mode, quota); swallow — the
    // log is diagnostic-only, never load-bearing.
  }
}
