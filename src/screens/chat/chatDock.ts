import type { ChatSurface } from './chatSurface';

/**
 * The space the chat asks the app shell to keep free for it (docs/voice/SYSTEM_DESIGN.md §4.3):
 * `side` the panel's strip on the right (the page slides left), `bottom` a bottom sheet's height
 * (phones during a call), `none` nothing (the chat floats over the page or is closed). Defined here, by its
 * producer; the shell (`src/app/`) reserves the space.
 */
export type ChatDock = 'none' | 'side' | 'bottom';

export interface ChatRouteProps {
  /** Called on mount and whenever the dock changes, before paint; `none` on unmount. */
  onDockChange?: (dock: ChatDock) => void;
}

/**
 * Where the chat sits at this viewport: `slide` the floating panel while the page slides left
 * (wide), `card` the same panel over the unmoved page (medium: the overlay), `sheet` the phone's
 * sheets (`CHAT_SHEET_QUERY`).
 */
export type ChatLayout = 'slide' | 'card' | 'sheet';

/**
 * The slide (docs/voice/SYSTEM_DESIGN.md §4.3): wide enough for the full CV card, the panel with
 * its gutter and a margin on each side of the card once the page has slid left:
 * `--page-max-width` 1120 + `--chat-dock-width` (`--chat-panel-width` 400 + `--space-4` 16)
 * + 2 × `--space-6` 24 = 1584 px. Media queries can't read custom properties, so the sum is a
 * literal; `chatDock.test.ts` checks it against the tokens. The page slides; the panel is the same
 * floating frame as below (600–1583 px it floats over the unmoved page, the overlay).
 */
export const CHAT_SLIDE_QUERY = '(min-width: 1584px) and (min-height: 500px)';

/** The dock for a surface at a layout (the §4.3 table). */
export function chatDock(surface: ChatSurface, layout: ChatLayout): ChatDock {
  if (layout === 'sheet') return surface === 'call' ? 'bottom' : 'none';
  const open = surface === 'text' || surface === 'call' || surface === 'callChat';
  return layout === 'slide' && open ? 'side' : 'none';
}
