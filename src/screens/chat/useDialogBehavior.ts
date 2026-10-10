import { useEffect, type KeyboardEvent, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogBehaviorOptions {
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
  /** The phone's sheet: focus the panel itself on open, so the on-screen keyboard stays down. */
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
 * panel), Esc; when modal also the Tab trap and pointer-down outside. Returns the dialog's key
 * handler.
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
  // Initial focus once, on open: the textarea above the phone, the panel on the phone's sheet.
  useEffect(() => {
    (sheet ? dialogRef.current : (initialFocusRef.current ?? dialogRef.current))?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the dialog opens
  }, []);

  useEffect(() => {
    if (!modal || !active) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) onOutsidePointerDown();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [modal, active, dialogRef, onOutsidePointerDown]);

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
