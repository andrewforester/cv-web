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

/** Everything the show's stateless screen renders (docs/design/retro/SPEC.md). */
export interface RetroShowUiState {
  /** Which windows the dock shows; the page reserves the dock's width while any is open. */
  windows: 'none' | 'chat' | 'chatAndConsole';
  chat: WindowUi & {
    lines: ChatLineUi[];
    draft: string;
    /** The composer takes Enter (the chat is open and no reply is streaming). */
    canSend: boolean;
    /** The visitor used up their messages: the composer is dim and shows the limit line. */
    limitReached: boolean;
  };
  console: WindowUi & {
    lines: ConsoleLineUi[];
    /** A caret sits at the end of the last line. */
    typing: boolean;
    progress: { label: string; percent: number };
    /** Visually hidden live line for the last finished step. */
    announcement: string;
  };
  decorations: { id: DecorationId; box: DecorationBox | null }[];
}
