import { useEffect, type RefObject } from 'react';

/**
 * Fits the full-screen sheet to the visible area while the on-screen keyboard is open: Chrome
 * Android (without `interactive-widget=resizes-content`) and iOS Safari only shrink the visual
 * viewport, so `100dvh` would leave the top of the sheet off-screen. Writes `--chat-vv-height` and
 * `--chat-vv-top` on the dialog (CSS falls back to `100dvh` / `0`); does nothing when not a sheet.
 */
export function useVisualViewportFit(dialogRef: RefObject<HTMLElement | null>, sheet: boolean) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const dialog = dialogRef.current;
    if (!sheet || !viewport || !dialog) return;
    const fit = () => {
      dialog.style.setProperty('--chat-vv-height', `${viewport.height}px`);
      dialog.style.setProperty('--chat-vv-top', `${viewport.offsetTop}px`);
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    return () => {
      viewport.removeEventListener('resize', fit);
      viewport.removeEventListener('scroll', fit);
      dialog.style.removeProperty('--chat-vv-height');
      dialog.style.removeProperty('--chat-vv-top');
    };
  }, [dialogRef, sheet]);
}
