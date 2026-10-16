import { describe, expect, it } from 'vitest';
import { CHAT_LIMITS } from '../../src/data/chat/contract.js';
import { PAGE_V4, questionV4, VALID_BODY, v4Body } from '../test/helpers.js';
import { validateChatRequest } from './validate.js';

const answer = (content: string) => ({ role: 'assistant' as const, content });

function codeOf(body: unknown) {
  const result = validateChatRequest(body);
  return result.ok ? 'ok' : result.error.code;
}

describe('validateChatRequest', () => {
  it('accepts a valid request and drops unknown fields', () => {
    const result = validateChatRequest({ ...VALID_BODY, extra: true, inputMode: 'text' });
    expect(result).toEqual({ ok: true, request: { ...VALID_BODY, toolRound: 0 } });
  });

  it.each([
    ['not an object', []],
    ['null', null],
    ['v missing', { messages: [questionV4('hi')] }],
    ['v a string', { v: '4', messages: [questionV4('hi')] }],
    ['messages not an array', { v: 4, messages: 'hi' }],
    ['message not an object', { v: 4, messages: ['hi'] }],
    ['unknown role', { v: 4, messages: [{ role: 'system', content: 'x', page: PAGE_V4 }] }],
    ['starts with assistant', { v: 4, messages: [answer('x')] }],
    ['ends with assistant', v4Body(questionV4('q'), answer('a'))],
    ['two questions in a row', v4Body(questionV4('a'), questionV4('b'))],
    ['a question without page', { v: 4, messages: [{ role: 'user', content: 'hi' }] }],
    ['content not a string', { v: 4, messages: [{ role: 'user', content: 5, page: PAGE_V4 }] }],
  ])('rejects %s with invalid_request', (_, body) => {
    expect(codeOf(body)).toBe('invalid_request');
  });

  it.each([1, 2, 3, 5])('rejects v: %i with unsupported_version', (v) => {
    const result = validateChatRequest({ ...VALID_BODY, v });
    expect(result).toEqual({
      ok: false,
      error: {
        code: 'unsupported_version',
        message: `Unsupported version v=${v}`,
        retryable: false,
      },
    });
  });

  it('rejects a retired v1 or v2 body with unsupported_version', () => {
    const v1 = { v: 1, locale: 'en', messages: [{ role: 'user', content: 'Hi' }] };
    const v2 = { v: 2, locale: 'en', page: 'cv', messages: [questionV4('Hi')] };
    expect(codeOf(v1)).toBe('unsupported_version');
    expect(codeOf(v2)).toBe('unsupported_version');
  });

  it('allows a 4,000-char answer in history and rejects 4,001', () => {
    const history = (length: number) =>
      v4Body(questionV4('q'), answer('a'.repeat(length)), questionV4('q'));
    expect(codeOf(history(CHAT_LIMITS.maxAssistantMessageChars))).toBe('ok');
    expect(codeOf(history(CHAT_LIMITS.maxAssistantMessageChars + 1))).toBe('too_long');
  });

  it('rejects more than 32,000 chars in total with too_long', () => {
    // 10 questions x 1,000 + 6 x 4,000 + 3 x 1 = 34,003
    const messages = Array.from({ length: 19 }, (_, index) =>
      index % 2 === 0
        ? questionV4('a'.repeat(1_000))
        : answer(index < 13 ? 'a'.repeat(4_000) : 'a'),
    );
    expect(codeOf(v4Body(...messages))).toBe('too_long');
  });
});
