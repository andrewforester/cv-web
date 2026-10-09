import { describe, expect, it } from 'vitest';
import tokensCss from '../../theme/tokens.css?raw';
import { CHAT_SLIDE_QUERY, chatDock, type ChatDock, type ChatLayout } from './chatDock';
import type { ChatSurface } from './chatSurface';

/** A `--name: <n>px;` token from the theme, in px. */
function tokenPx(name: string): number {
  const match = new RegExp(`${name}:\\s*(\\d+)px;`).exec(tokensCss);
  if (!match?.[1]) throw new Error(`${name} is not a px token in tokens.css`);
  return Number(match[1]);
}

describe('CHAT_SLIDE_QUERY', () => {
  it('starts where the card, the panel and a margin on each side of the card fit (§4.3)', () => {
    const sum =
      tokenPx('--page-max-width') +
      tokenPx('--chat-panel-width') +
      tokenPx('--space-4') +
      2 * tokenPx('--space-6');
    expect(CHAT_SLIDE_QUERY).toBe(`(min-width: ${sum}px) and (min-height: 500px)`);
  });

  it('counts the panel and its gutter, the strip --chat-dock-width reserves', () => {
    const dockWidth = /--chat-dock-width:([^;]+);/.exec(tokensCss)?.[1]?.replace(/\s+/g, '');
    expect(dockWidth).toBe('calc(var(--chat-panel-width)+var(--space-4))');
  });
});

describe('chatDock', () => {
  // The §4.3 table: surface → dock per layout (slide, overlay, phone).
  const table: Record<ChatSurface, Record<ChatLayout, ChatDock>> = {
    closed: { slide: 'none', card: 'none', sheet: 'none' },
    text: { slide: 'side', card: 'none', sheet: 'none' },
    call: { slide: 'side', card: 'none', sheet: 'bottom' },
    callChat: { slide: 'side', card: 'none', sheet: 'none' },
    callPill: { slide: 'none', card: 'none', sheet: 'none' },
  };

  for (const [surface, docks] of Object.entries(table) as [
    ChatSurface,
    Record<ChatLayout, ChatDock>,
  ][]) {
    it(`follows §4.3 for ${surface}`, () => {
      expect({
        slide: chatDock(surface, 'slide'),
        card: chatDock(surface, 'card'),
        sheet: chatDock(surface, 'sheet'),
      }).toEqual(docks);
    });
  }
});
