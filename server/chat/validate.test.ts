import { describe, expect, it } from 'vitest';
import { CHAT_LIMITS, type ChatMessage } from '../../src/data/chat/contract.js';
import { VALID_BODY } from '../test/helpers.js';
import { validateChatRequest } from './validate.js';

/** A valid alternating conversation of `count` messages (odd count ends with `user`). */
function conversation(count: number, content = 'hi'): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content,
  }));
}

function codeOf(body: unknown) {
  const result = validateChatRequest(body);
  return result.ok ? 'ok' : result.error.code;
}

describe('validateChatRequest', () => {
  it('accepts a valid request and drops unknown fields', () => {
    const result = validateChatRequest({ ...VALID_BODY, extra: true, inputMode: 'text' });
    expect(result).toEqual({ ok: true, request: VALID_BODY });
  });

  it.each([
    ['not an object', []],
    ['null', null],
    ['v missing', { locale: 'en', messages: conversation(1) }],
    ['v a string', { v: '1', locale: 'en', messages: conversation(1) }],
    ['unknown locale', { v: 1, locale: 'de', messages: conversation(1) }],
    ['messages not an array', { v: 1, locale: 'en', messages: 'hi' }],
    ['no messages', { v: 1, locale: 'en', messages: [] }],
    ['message not an object', { v: 1, locale: 'en', messages: ['hi'] }],
    ['unknown role', { v: 1, locale: 'en', messages: [{ role: 'system', content: 'x' }] }],
    [
      'starts with assistant',
      { v: 1, locale: 'en', messages: [{ role: 'assistant', content: 'x' }] },
    ],
    ['ends with assistant', { v: 1, locale: 'en', messages: conversation(2) }],
    [
      'two users in a row',
      {
        v: 1,
        locale: 'en',
        messages: [
          { role: 'user', content: 'a' },
          { role: 'user', content: 'b' },
        ],
      },
    ],
    ['blank content', { v: 1, locale: 'en', messages: [{ role: 'user', content: '  \n ' }] }],
    ['content not a string', { v: 1, locale: 'en', messages: [{ role: 'user', content: 5 }] }],
  ])('rejects %s with invalid_request', (_, body) => {
    expect(codeOf(body)).toBe('invalid_request');
  });

  it('rejects another version with unsupported_version', () => {
    expect(codeOf({ ...VALID_BODY, v: 3 })).toBe('unsupported_version');
  });

  it('allows 20 messages and rejects 21 with conversation_limit', () => {
    // 20 messages would end with an assistant turn, so 19 is the longest valid odd history.
    expect(codeOf({ v: 1, locale: 'en', messages: conversation(19) })).toBe('ok');
    expect(codeOf({ v: 1, locale: 'en', messages: conversation(20) })).toBe('invalid_request');
    expect(codeOf({ v: 1, locale: 'en', messages: conversation(21) })).toBe('conversation_limit');
  });

  it('allows a 1,000-char question and rejects 1,001 with too_long', () => {
    const at = (length: number) => ({
      v: 1,
      locale: 'en',
      messages: [{ role: 'user', content: 'a'.repeat(length) }],
    });
    expect(codeOf(at(CHAT_LIMITS.maxUserMessageChars))).toBe('ok');
    const result = validateChatRequest(at(CHAT_LIMITS.maxUserMessageChars + 1));
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'too_long', message: 'messages[0].content exceeds 1000 characters' },
    });
  });

  it('allows a 4,000-char answer in history and rejects 4,001', () => {
    const history = (length: number) => ({
      v: 1,
      locale: 'uk',
      messages: [
        { role: 'user', content: 'q' },
        { role: 'assistant', content: 'a'.repeat(length) },
        { role: 'user', content: 'q' },
      ],
    });
    expect(codeOf(history(CHAT_LIMITS.maxAssistantMessageChars))).toBe('ok');
    expect(codeOf(history(CHAT_LIMITS.maxAssistantMessageChars + 1))).toBe('too_long');
  });

  it('rejects more than 24,000 chars in total with too_long', () => {
    const messages = conversation(19, 'a'.repeat(1_000));
    messages[1] = { role: 'assistant', content: 'a'.repeat(4_000) };
    messages[3] = { role: 'assistant', content: 'a'.repeat(4_000) };
    // 10 users x 1,000 + 2 x 4,000 + 7 x 1,000 = 25,000
    expect(codeOf({ v: 1, locale: 'en', messages })).toBe('too_long');
  });
});
