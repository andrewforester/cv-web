import type { CSSProperties } from 'react';

/**
 * Names a show-owned element (dock, decoration, highlight) for view transitions, so it stays live
 * during a morph instead of freezing in the old picture (`RetroMotion.module.css` → `.live`).
 * Names must be unique on the page.
 */
export const liveName = (name: string) => ({ '--retro-live-name': name }) as CSSProperties;
