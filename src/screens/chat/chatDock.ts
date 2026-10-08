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
