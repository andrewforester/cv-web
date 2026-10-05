import { describe, expect, it } from 'vitest';
import type { AgentToolCall } from '../../src/data/chat/contract.js';
import {
  PAGE_V4,
  questionV4,
  SCROLL_IMPACT,
  toolResults,
  toolTurn,
  v4Body,
} from '../test/helpers.js';
import { validateChatRequest } from './validate.js';

const withPage = (page: Record<string, unknown>) => v4Body({ ...questionV4('Hi'), page } as never);
const errorOf = (body: unknown) => {
  const result = validateChatRequest(body);
  return result.ok ? undefined : result.error;
};

describe('validateChatRequest: v4', () => {
  it('accepts the API.md example: no locale, no page, the snapshot without route and locale', () => {
    const result = validateChatRequest(v4Body());
    expect(result).toEqual({ ok: true, request: { ...v4Body(), toolRound: 0 } });
  });

  it('ignores page, locale and snapshot fields it does not know', () => {
    const body = {
      ...v4Body({ ...questionV4('Hi'), page: { ...PAGE_V4, route: '/', locale: 'de' } } as never),
      locale: 'de',
      page: 'profile',
    };
    expect(validateChatRequest(body)).toEqual({
      ok: true,
      request: { v: 4, messages: [questionV4('Hi')], toolRound: 0 },
    });
  });

  it('accepts a tool round and counts it', () => {
    const turn = toolTurn([SCROLL_IMPACT]);
    const result = validateChatRequest(
      v4Body(questionV4('Show his impact'), turn, toolResults([SCROLL_IMPACT])),
    );
    expect(result).toMatchObject({ ok: true, request: { v: 4, toolRound: 1 } });
  });

  it('checks the snapshot against the one page', () => {
    expect(errorOf(withPage({ ...PAGE_V4, activeSection: 'apps' }))?.message).toBe(
      'messages[0].page.activeSection is invalid',
    );
    for (const highlighted of ['technology:kotlin', 'experience:nope', 'app:savant']) {
      expect(errorOf(withPage({ ...PAGE_V4, highlighted }))?.code).toBe('invalid_request');
    }
    expect(errorOf(withPage({ ...PAGE_V4, tools: ['switchLanguage'] }))?.message).toBe(
      "messages[0].page.tools must list the page's tool names",
    );
    expect(errorOf(withPage({ ...PAGE_V4, viewport: 'tablet' }))?.code).toBe('invalid_request');
    expect(errorOf(withPage({ ...PAGE_V4, chat: 'drawer' }))?.code).toBe('invalid_request');
    expect(errorOf(withPage({ ...PAGE_V4, tools: ['x'.repeat(1_000)] }))?.message).toBe(
      'messages[0].page exceeds 1000 characters',
    );
  });

  it('accepts every catalogue target as highlighted, and sorts and dedupes tools', () => {
    const page = {
      ...PAGE_V4,
      activeSection: 'contacts',
      highlighted: 'app:august-home',
      tools: ['scrollToSection', 'highlightElement', 'scrollToSection'],
    };
    expect(validateChatRequest(withPage(page))).toMatchObject({
      ok: true,
      request: {
        messages: [{ page: { ...page, tools: ['highlightElement', 'scrollToSection'] } }],
      },
    });
  });

  it('rejects a tool call outside the page catalogue', () => {
    const name = 'switchLanguage' as AgentToolCall['name'];
    const call: AgentToolCall = { id: 'toolu_1', name, input: { locale: 'de' } };
    expect(
      errorOf(v4Body(questionV4('German please'), toolTurn([call]), toolResults([call])))?.message,
    ).toBe('messages[1].toolCalls[0].name is not a known tool');
  });

  it('keeps the tool dialect limits', () => {
    expect(errorOf({ v: 4 })?.message).toBe('messages must be an array');
    expect(errorOf({ v: 4, messages: [] })?.message).toBe('messages must not be empty');
    const many = Array.from({ length: 41 }, (_, i) =>
      i % 2 ? { role: 'assistant', content: 'ok' } : questionV4('q'),
    );
    expect(errorOf({ v: 4, messages: many })?.code).toBe('conversation_limit');
    expect(errorOf(v4Body(questionV4('a'.repeat(1_001))))?.code).toBe('too_long');
    expect(errorOf(v4Body(questionV4('  ')))?.code).toBe('invalid_request');
  });
});
