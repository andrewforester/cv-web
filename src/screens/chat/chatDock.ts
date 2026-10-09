import type { ChatSurface } from './chatSurface';

/**
 * The space the chat asks the app shell to keep free for it (docs/voice/SYSTEM_DESIGN.md §4.3):
 * `side` a right column (the page shifts left), `bottom` a bottom sheet's height (phones during a
 * call), `none` nothing (the chat floats over the page or is closed). Defined here, by its
 * producer; the shell (`src/app/`) reserves the space.
 */
export type ChatDock = 'none' | 'side' | 'bottom';

export interface ChatRouteProps {
  /** Called on mount and whenever the dock changes, before paint; `none` on unmount. */
  onDockChange?: (dock: ChatDock) => void;
}

/**
 * Where the chat sits at this viewport: `column` docked on the right (wide: the page slides
 * left), `card` floating over the page (medium: the overlay), `sheet` the phone's sheets
 * (`CHAT_SHEET_QUERY`).
 */
export type ChatLayout = 'column' | 'card' | 'sheet';

/**
 * The docked column (the slide, docs/voice/SYSTEM_DESIGN.md §4.3): wide enough for the full CV
 * card, the column and a margin on each side of the card once the page has slid left:
 * `--page-max-width` 1120 + `--chat-dock-width` (`--chat-panel-width` 400 + `--space-4` 16)
 * + 2 × `--space-6` 24 = 1584 px. Media queries can't read custom properties, so the sum is a
 * literal here and in `ChatColumn.module.css`; `chatDock.test.ts` checks it against the tokens.
 * Narrower (600–1583 px) the chat floats over the unmoved page as a card (the overlay).
 */
export const CHAT_COLUMN_QUERY = '(min-width: 1584px) and (min-height: 500px)';

/** The dock for a surface at a layout (the §4.3 table). */
export function chatDock(surface: ChatSurface, layout: ChatLayout): ChatDock {
  if (layout === 'sheet') return surface === 'call' ? 'bottom' : 'none';
  const open = surface === 'text' || surface === 'call' || surface === 'callChat';
  return layout === 'column' && open ? 'side' : 'none';
}
