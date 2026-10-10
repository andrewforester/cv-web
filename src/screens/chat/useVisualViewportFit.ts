import { useEffect, type RefObject } from 'react';

/**
 * Keeps the phone's bottom sheet on the visible area while the on-screen keyboard is open: iOS
 * Safari (and Chrome Android without `interactive-widget=resizes-content`) only shrink the visual
 * viewport, so a sheet at the layout viewport's bottom would sit behind the keyboard. Writes
 * `--chat-vv-bottom` (how far the visual viewport's bottom is above the layout viewport's) and
 * `--chat-vv-height` on the panel (CSS falls back to `0` / `100dvh`): the sheet is anchored by
 * `bottom`, lifted by that gap and capped to the visible height. Anchoring by `bottom`, not `top`,
 * lets the browser keep it glued to the screen's bottom while Chrome's URL bar slides in or out on
 * scroll (no viewport events fire until that animation ends). Does nothing when not a sheet.
 */
export function useVisualViewportFit(dialogRef: RefObject<HTMLElement | null>, sheet: boolean) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const dialog = dialogRef.current;
    if (!sheet || !viewport || !dialog) return;
    const fit = () => {
      const gap = Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height);
      dialog.style.setProperty('--chat-vv-height', `${viewport.height}px`);
      dialog.style.setProperty('--chat-vv-bottom', `${gap}px`);
    };
    fit();
    viewport.addEventListener('resize', fit);
    viewport.addEventListener('scroll', fit);
    return () => {
      viewport.removeEventListener('resize', fit);
      viewport.removeEventListener('scroll', fit);
      dialog.style.removeProperty('--chat-vv-height');
      dialog.style.removeProperty('--chat-vv-bottom');
    };
  }, [dialogRef, sheet]);
}
