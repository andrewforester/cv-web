/** How long an unknown permission state may last before the "allow the microphone" hint shows. */
export const MIC_HINT_DELAY_MS = 400;

/**
 * Calls `show` only when the browser is probably asking for the microphone: the permission is
 * `prompt`, or it can't be queried and the request is still open after `MIC_HINT_DELAY_MS`.
 * Returns the cancel function (the request settled).
 */
export function watchMicPrompt(show: () => void): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fallback = () => {
    timer = setTimeout(() => {
      if (!cancelled) show();
    }, MIC_HINT_DELAY_MS);
  };
  const query = navigator.permissions?.query?.({ name: 'microphone' as PermissionName });
  if (!query) fallback();
  else {
    query.then(
      (status) => {
        if (cancelled) return;
        if (status.state === 'prompt') show();
        else if (status.state !== 'granted' && status.state !== 'denied') fallback();
      },
      () => {
        if (!cancelled) fallback();
      },
    );
  }
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}
