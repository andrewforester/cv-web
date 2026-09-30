import { describe, expect, it } from 'vitest';
import { NARRATE_BODY, replyBody } from '../../test/helpers.js';
import { validateShowRequest } from './validateShow.js';

const codeOf = (body: unknown) => {
  const result = validateShowRequest(body);
  return result.ok ? 'ok' : result.error.code;
};

const turns = (count: number, chars = 2) =>
  Array.from({ length: count }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: 'a'.repeat(chars),
  }));

describe('validateShowRequest', () => {
  it('accepts narrate and keeps only its fields', () => {
    const result = validateShowRequest({ ...NARRATE_BODY, messages: 'ignored', extra: 1 });
    expect(result).toEqual({ ok: true, request: NARRATE_BODY });
  });

  it('accepts a reply and keeps only the known fields', () => {
    const result = validateShowRequest({ ...replyBody(), extra: 1 });
    expect(result).toEqual({ ok: true, request: replyBody() });
  });

  it.each([
    ['before the first step', null, 0],
    ['after the last step', null, 3],
    ['during step 1', 'tokens', 0],
  ] as const)('accepts a reply %s', (_, step, stepsDone) => {
    expect(codeOf(replyBody({ step, stepsDone }))).toBe('ok');
  });

  it.each([
    ['locale uk', { ...NARRATE_BODY, locale: 'uk' }],
    ['no kind', { ...NARRATE_BODY, kind: undefined }],
    ['an unknown kind', { ...NARRATE_BODY, kind: 'chat' }],
    ['a scenario that is not a string', { ...NARRATE_BODY, scenario: 1 }],
    ['an unknown step', replyBody({ step: 'fonts' as never })],
    ['a missing step', { ...replyBody(), step: undefined }],
    ['stepsDone below 0', replyBody({ stepsDone: -1 })],
    ['stepsDone past the last step', replyBody({ stepsDone: 4 })],
    ['a fractional stepsDone', replyBody({ stepsDone: 1.5 })],
    ['a missing stepsDone', { ...replyBody(), stepsDone: undefined }],
    ['no messages', { ...replyBody(), messages: undefined }],
    ['empty messages', replyBody({ messages: [] })],
    ['an assistant first', { ...replyBody(), messages: [{ role: 'assistant', content: 'Hi' }] }],
    ['ending with the assistant', { ...replyBody(), messages: turns(2) }],
    ['a blank message', { ...replyBody(), messages: [{ role: 'user', content: '  ' }] }],
    ['a non-object message', { ...replyBody(), messages: ['hi'] }],
    ['an array body', [NARRATE_BODY]],
  ])('rejects %s with invalid_request', (_, body) => {
    expect(codeOf(body)).toBe('invalid_request');
  });

  it('answers an unknown scenario id with unsupported_version (an old tab goes scripted)', () => {
    expect(codeOf({ ...NARRATE_BODY, scenario: 'retro-0' })).toBe('unsupported_version');
    expect(codeOf(replyBody({ scenario: 'retro-2' as never }))).toBe('unsupported_version');
  });

  it('accepts 19 messages (the most that end with the visitor), answers 21 with conversation_limit', () => {
    expect(codeOf({ ...replyBody(), messages: turns(19) })).toBe('ok');
    expect(codeOf({ ...replyBody(), messages: turns(21) })).toBe('conversation_limit');
  });

  it('caps visitor and assistant messages at 1,000 characters (too_long)', () => {
    expect(codeOf({ ...replyBody(), messages: turns(1, 1_000) })).toBe('ok');
    expect(codeOf({ ...replyBody(), messages: turns(1, 1_001) })).toBe('too_long');
    const longAnswer = [
      ...turns(1),
      { role: 'assistant', content: 'a'.repeat(1_001) },
      turns(1)[0],
    ];
    expect(codeOf({ ...replyBody(), messages: longAnswer })).toBe('too_long');
  });
});
