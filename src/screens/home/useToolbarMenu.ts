import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface ToolbarMenu {
  open: boolean;
  toggle: () => void;
  close: () => void;
  /** The toggle button: focus returns to it when Escape closes the menu. */
  toggleRef: RefObject<HTMLButtonElement | null>;
}

/** Open state of the toolbar's section menu (narrow screens): Escape and a tap outside `bar` close it. */
export function useToolbarMenu(bar: RefObject<HTMLElement | null>): ToolbarMenu {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toggle = useCallback(() => setOpen((value) => !value), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!bar.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, bar]);

  return { open, toggle, close, toggleRef };
}
