import type { ChatSurface } from './chatSurface';

/**
 * The space the chat asks the app shell to keep free for it (docs/voice/SYSTEM_DESIGN.md §4.3):
 * `side` a right column (the page shifts left), `bottom` a bottom sheet's height (phones during a
 * call), `none` nothing (the chat floats over the page or is closed). Defined here, by its
 * producer; the shell (`src/app/`) reserves the space.
 */
export type ChatDock = 'none' | 'side' | 'bottom';

export interface ChatRouteProps {
  /** Called on mount and whenever the dock changes; `none` on unmount. */
  onDockChange?: (dock: ChatDock) => void;
}

/**
 * Where the chat sits at this viewport: `column` docked on the right (wide), `card` floating
 * (medium), `sheet` the phone's sheets (`CHAT_SHEET_QUERY`).
 */
export type ChatLayout = 'column' | 'card' | 'sheet';

/** The docked column: wide and tall enough (docs/design/voice/SPEC.md → Layout zones). */
export const CHAT_COLUMN_QUERY = '(min-width: 1024px) and (min-height: 500px)';

/** The dock for a surface at a layout (the §4.3 table). */
export function chatDock(surface: ChatSurface, layout: ChatLayout): ChatDock {
  if (layout === 'sheet') return surface === 'call' ? 'bottom' : 'none';
  const open = surface === 'text' || surface === 'call' || surface === 'callChat';
  return layout === 'column' && open ? 'side' : 'none';
}
