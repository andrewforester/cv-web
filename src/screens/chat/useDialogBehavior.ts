import { useEffect, type KeyboardEvent, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogBehaviorOptions {
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
  /** Full-screen sheet: focus the dialog itself on open, lock page scroll, no outside clicks. */
  sheet: boolean;
  /** Off beside the slid page: no Tab trap, no outside clicks, the page stays usable. */
  modal?: boolean;
  /** While closing, outside clicks are ignored. */
  active: boolean;
  onEscape: () => void;
  onOutsidePointerDown: () => void;
}

/**
 * Dialog behaviour of the chat panel (SPEC → Accessibility): initial focus (the field, else the
 * dialog), Esc; when modal also the Tab trap, pointer-down outside (card) and the page scroll lock
 * (sheet). Returns the dialog's key handler.
 */
export function useDialogBehavior({
  dialogRef,
  initialFocusRef,
  sheet,
  modal = true,
  active,
  onEscape,
  onOutsidePointerDown,
}: DialogBehaviorOptions): (event: KeyboardEvent<HTMLElement>) => void {
  // Initial focus once, on open: the textarea on desktop, the dialog on the sheet.
  useEffect(() => {
    (sheet ? dialogRef.current : (initialFocusRef.current ?? dialogRef.current))?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the dialog opens
  }, []);

  useEffect(() => {
    if (sheet || !modal || !active) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) onOutsidePointerDown();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [sheet, modal, active, dialogRef, onOutsidePointerDown]);

  useEffect(() => {
    if (!sheet) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [sheet]);

  return (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscape();
      return;
    }
    if (event.key !== 'Tab' || !modal || !dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    const current = document.activeElement;
    if (event.shiftKey && (current === first || current === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  };
}
