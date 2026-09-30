import type { ConsoleLineKind } from './engine/showTypes';
import type { DecorationId } from './scenario';

export interface ChatLineUi {
  id: number;
  kind: 'system' | 'agent' | 'visitor';
  /** `HH:MM`, the visitor's local time. */
  time: string;
  /** As far as it has typed. */
  text: string;
}

export interface ConsoleLineUi {
  kind: ConsoleLineKind;
  text: string;
}

/** Where a decoration sits, in page (document) pixels; `null` until its anchor is on the page. */
export interface DecorationBox {
  left: number;
  top: number;
  width?: number;
}

export interface WindowUi {
  minimised: boolean;
}

/** A highlighted target's border box, in page (document) pixels. */
export interface HighlightBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The show's pointer on the current chunk's target (SPEC → Show what changed). */
export interface HighlightUi {
  /** The chunk's key: a new chunk's highlight fades in afresh. */
  key: string;
  /** `typing`: the outline; `applied`: plus the fill flash; `fading`: going away. */
  phase: 'typing' | 'applied' | 'fading';
  /** A page-wide chunk: a frame around the page area instead of boxes. */
  page: boolean;
  boxes: HighlightBox[];
}

/** Everything the show's stateless screen renders (docs/design/retro/SPEC.md). */
export interface RetroShowUiState {
  /**
   * Which windows the dock shows; the page reserves the dock's width while any is open.
   * `closing`: both windows are flying off and the reserve is being released.
   */
  windows: 'none' | 'chat' | 'chatAndConsole' | 'closing';
  chat: WindowUi & {
    lines: ChatLineUi[];
    draft: string;
    /** The composer takes Enter (the chat is open and no reply is streaming). */
    canSend: boolean;
    /** The visitor used up their messages: the composer is dim and shows the limit line. */
    limitReached: boolean;
    /** The windows are closing: the composer stops taking input. */
    readOnly: boolean;
  };
  console: WindowUi & {
    lines: ConsoleLineUi[];
    /** A caret sits at the end of the last line. */
    typing: boolean;
    progress: { label: string; percent: number };
    /** Visually hidden live line for the last finished step. */
    announcement: string;
  };
  /** `leaving`: removed a moment ago, fading out before it unmounts. */
  decorations: { id: DecorationId; box: DecorationBox | null; leaving: boolean }[];
  highlight: HighlightUi | null;
}
