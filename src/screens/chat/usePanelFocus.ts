import { useEffect, useRef, type RefObject } from 'react';
import type { FocusRequest } from './voice/VoiceUiState';

/** What the one panel shows: the text chat, the call's orb view, the chat during the call. */
export type PanelView = 'text' | 'call' | 'callChat';

interface PanelFocusOptions extends PanelFocusRefs {
  view: PanelView;
  closing: boolean;
  sheet: boolean;
  /** The chat is back from a call that left nothing: Call gets the focus. */
  focusCall: boolean;
  takeFocusRequest?: (() => FocusRequest | null) | undefined;
}

/** The panel's focus targets (`ChatPanel`'s refs). */
export interface PanelFocusRefs {
  panel: RefObject<HTMLElement | null>;
  input: RefObject<HTMLTextAreaElement | null>;
  toggle: RefObject<HTMLButtonElement | null>;
  callButton: RefObject<HTMLButtonElement | null>;
}

type Target = keyof PanelFocusRefs;

function target(
  request: FocusRequest | null,
  view: PanelView,
  { sheet, focusCall, callEnded }: { sheet: boolean; focusCall: boolean; callEnded: boolean },
): Target {
  if (request === 'toggle') return 'toggle';
  if (request === 'field') return 'input';
  if (view === 'call') return 'panel';
  if (focusCall) return 'callButton';
  return sheet && !callEnded ? 'panel' : 'input';
}

/**
 * Where the focus goes when the panel opens (also when reopened mid-exit) or changes view
 * (docs/design/voice/SPEC.md → Accessibility), so a screen reader hears the new view: a swap that
 * handed the focus over keeps it (the toggle stays the toggle; typing begun in the phone's call
 * sheet goes on in the field); the orb view takes it on the panel itself (End never gets it); a
 * call that left nothing gives it back to Call; a call that ended here, to the field; otherwise
 * the dialog's rule (the field, the phone sheet itself).
 */
export function usePanelFocus(options: PanelFocusOptions): void {
  const { view, closing, sheet, focusCall, takeFocusRequest } = options;
  const { panel, input, toggle, callButton } = options;
  const lastView = useRef<PanelView | null>(null);
  useEffect(() => {
    if (closing) return;
    const before = lastView.current;
    lastView.current = view;
    const callEnded = before !== null && before !== 'text' && view === 'text';
    const refs: PanelFocusRefs = { panel, input, toggle, callButton };
    const request = takeFocusRequest?.() ?? null;
    refs[target(request, view, { sheet, focusCall, callEnded })].current?.focus();
  }, [view, closing, sheet, focusCall, takeFocusRequest, panel, input, toggle, callButton]);
}
