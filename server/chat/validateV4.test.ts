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

describe('validateChatRequest: v4 voiceCalls', () => {
  const line = (text: string, role: 'visitor' | 'agent' = 'visitor') => ({ role, text });
  const call = (...lines: unknown[]) => ({ lines });
  const asked = (voiceCalls: unknown, content = 'And before that?') =>
    ({ ...questionV4(content), voiceCalls }) as never;
  const CALL = call(line('Where does he work now?'), line('At Transcenda.', 'agent'));

  it('accepts the API.md example and keeps role and text only', () => {
    const sent = call({ ...line('Hi', 'agent'), id: 'l1', final: true });
    expect(validateChatRequest(v4Body(asked([CALL, sent])))).toEqual({
      ok: true,
      request: {
        v: 4,
        messages: [
          { ...questionV4('And before that?'), voiceCalls: [CALL, call(line('Hi', 'agent'))] },
        ],
        toolRound: 0,
      },
    });
  });

  it('accepts calls on an earlier question too', () => {
    const body = v4Body(
      asked([CALL]),
      { role: 'assistant', content: 'Before that…' },
      questionV4('q'),
    );
    expect(validateChatRequest(body)).toMatchObject({ ok: true });
  });

  it('rejects calls on a tool-results message', () => {
    const results = { ...toolResults([SCROLL_IMPACT]), voiceCalls: [CALL] } as never;
    expect(
      errorOf(v4Body(questionV4('Show his impact'), toolTurn([SCROLL_IMPACT]), results)),
    ).toMatchObject({
      code: 'invalid_request',
      message: 'messages[2] must carry toolResults only',
    });
  });

  it('rejects a bad shape with invalid_request', () => {
    const bad: unknown[] = [
      [],
      null,
      'call',
      [{}],
      [call()],
      [call(line('  '))],
      [call({ role: 'user', text: 'Hi' })],
      [call({ role: 'visitor', text: 1 })],
      [call('Hi')],
    ];
    for (const voiceCalls of bad) {
      expect(errorOf(v4Body(asked(voiceCalls)))?.code, JSON.stringify(voiceCalls)).toBe(
        'invalid_request',
      );
    }
  });

  it('allows 3 calls of 60 lines, rejects a 4th call or a 61st line with invalid_request', () => {
    const sixty = call(...Array.from({ length: 60 }, () => line('ok')));
    expect(validateChatRequest(v4Body(asked([sixty, sixty, sixty])))).toMatchObject({ ok: true });
    expect(errorOf(v4Body(asked([CALL, CALL, CALL, CALL])))?.message).toBe(
      'messages[0].voiceCalls has more than 3 calls',
    );
    expect(errorOf(v4Body(asked([CALL, call(...sixty.lines, line('one more'))])))?.message).toBe(
      'messages[0].voiceCalls[1].lines has more than 60 lines',
    );
  });

  it('allows a 1,000-char line and a 4,000-char call, rejects more with too_long', () => {
    const long = (chars: number) => line('a'.repeat(chars));
    const full = call(long(1_000), long(1_000), long(1_000), long(1_000));
    expect(validateChatRequest(v4Body(asked([full])))).toMatchObject({ ok: true });
    expect(errorOf(v4Body(asked([call(long(1_001))])))).toMatchObject({
      code: 'too_long',
      message: 'messages[0].voiceCalls[0].lines[0] exceeds 1000 characters',
    });
    expect(errorOf(v4Body(asked([CALL, call(...full.lines, long(1))])))).toMatchObject({
      code: 'too_long',
      message: 'messages[0].voiceCalls[1] exceeds 4000 characters',
    });
  });

  it('counts voice text in the 32,000-char total, not as questions or messages', () => {
    const full = call(...Array.from({ length: 4 }, () => line('a'.repeat(1_000))));
    // Each question: 3 calls x 4,000 + 1 = 12,001 chars; 2 of them fit, the 3rd crosses 32,000.
    const question = asked([full, full, full], 'q');
    const answer = { role: 'assistant', content: 'a' } as never;
    expect(validateChatRequest(v4Body(question, answer, question))).toMatchObject({ ok: true });
    expect(errorOf(v4Body(question, answer, question, answer, question))).toMatchObject({
      code: 'too_long',
      message: 'messages exceed 32000 characters in total',
    });
  });
});
