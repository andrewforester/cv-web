import type { ConsoleRow } from './engine/showTypes';
import type { DecorationId } from './scenario';

export interface ChatLineUi {
  id: number;
  kind: 'agent' | 'visitor';
  /** As far as it has arrived. */
  text: string;
  /** An agent line still arriving (scripted reveal or LLM tokens): it ends with the caret. */
  streaming: boolean;
}

/** The page's nav items and marquee (top bar) and webring name (footer). */
export interface DecorationCopyUi {
  nav: string[];
  marquee: string;
  webringName: string;
}

/** Where a decoration sits, in page (document) pixels; `null` until its anchor is on the page. */
export interface DecorationBox {
  left: number;
  top: number;
  width?: number;
}

/** Widths of a box's four sides in px (`top right bottom left`). */
export interface BoxEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * A highlighted target as DevTools' Elements tab draws it: its border box in page (document)
 * pixels and the widths of its margin (negative margins as 0), border and padding.
 */
export interface HighlightBox {
  left: number;
  top: number;
  width: number;
  height: number;
  margin: BoxEdges;
  border: BoxEdges;
  padding: BoxEdges;
}

/** The Elements-tab tooltip in the page area's corner (SPEC → Highlight → Plate). */
export interface HighlightPlate {
  tag: string;
  /** `#id`, if the element has one. */
  id: string;
  /** `.class`: the first class with its CSS Modules hash stripped; `''` when none reads well. */
  className: string;
  /** Border-box `W × H` in whole px; `null` with several matches. */
  size: { width: number; height: number } | null;
  /** All matches on the page when there are several (`× N`); `null` for one. */
  count: number | null;
  /**
   * Where the plate's bottom-left corner sits, in viewport px (the first target's bottom-left
   * corner, clamped into the page area); `null` for page-wide chunks: the page area's corner.
   */
  anchor: { left: number; bottom: number } | null;
}

/** The show's pointer on the current chunk's target (SPEC → Show what changed). */
export interface HighlightUi {
  /** The chunk's key: a new chunk's highlight fades in afresh. */
  key: string;
  /** `typing`: the overlay; `applied`: plus the content flash; `fading`: going away. */
  phase: 'typing' | 'applied' | 'fading';
  /** A page-wide chunk: the page area is tinted instead of boxes. */
  page: boolean;
  boxes: HighlightBox[];
  /** `null` until the target is on the page. */
  plate: HighlightPlate | null;
}

/** Everything the show's stateless screen renders (docs/design/retro/SPEC.md). */
export interface RetroShowUiState {
  /**
   * Which panels the dock shows (SPEC → Timeline, End of the show). The page reserves the dock's
   * width for `chat` and `chatAndConsole`. `undocked`: DevTools has slid out (it stays mounted,
   * hidden) and the reserve is released; `closing`: then the chat shrinks into the launcher.
   */
  windows: 'none' | 'chat' | 'chatAndConsole' | 'undocked' | 'closing';
  /**
   * Token shield (SPEC → Agent chat panel): the site's design tokens with their live values,
   * re-declared on the dock so the damage token layers on `:root` never restyle it.
   */
  tokens: Readonly<Record<string, string>>;
  chat: {
    minimised: boolean;
    lines: ChatLineUi[];
    /** A reply was asked for and its first token hasn't come: the typing dots. */
    waiting: boolean;
    /** The browser is offline: the banner under the header. */
    offline: boolean;
    draft: string;
    /** The composer takes Enter (the chat is open, no reply is streaming, the draft fits). */
    canSend: boolean;
    /** The draft is over the length limit: error meta text, Send disabled. */
    tooLong: boolean;
    /** The draft is long enough to show the `{count} / 500` counter. */
    counterVisible: boolean;
    /** The visitor used up their messages: the notice in the list, the field disabled. */
    limitReached: boolean;
    /** The show is closing: the composer stops taking input. */
    readOnly: boolean;
  };
  /** The DevTools console (SPEC → DevTools console): its rows and the toolbar's ✖ / ⚠ counters. */
  console: {
    rows: ConsoleRow[];
    /** ✖: chunks not done yet; ⚠: steps not done yet (both 0 at the end). */
    counters: { errors: number; warnings: number };
    /** Visually hidden live line for the last finished step. */
    announcement: string;
  };
  /** `leaving`: removed a moment ago, fading out before it unmounts. */
  decorations: { id: DecorationId; box: DecorationBox | null; leaving: boolean }[];
  /** The decorations' texts on this page (SPEC → Texts). */
  decorationCopy: DecorationCopyUi;
  highlight: HighlightUi | null;
}
