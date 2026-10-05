import { describe, expect, it } from 'vitest';
import { SCROLL_IMPACT } from '../test/helpers.js';
import type { LlmAssistantBlock } from './llm/LlmClient.js';
import { encodeProviderState, rebuildAssistantTurn } from './providerState.js';

const OPEN_EMAIL = { id: 'toolu_2', name: 'openContact' as const, input: { channel: 'email' } };
const TURN: LlmAssistantBlock[] = [
  { type: 'thinking', thinking: 'Plan', signature: 'sig' },
  { type: 'text', text: 'One. ' },
  { type: 'redacted_thinking', data: 'enc' },
  { type: 'text', text: 'Two.' },
  { type: 'tool_use', ...SCROLL_IMPACT },
  { type: 'tool_use', ...OPEN_EMAIL },
];

describe('providerState', () => {
  it('round-trips the turn: non-text blocks unchanged, text from content, same order', () => {
    const state = encodeProviderState(TURN);
    expect(state).not.toContain('One.');
    expect(rebuildAssistantTurn('One. Two.', [SCROLL_IMPACT, OPEN_EMAIL], state)).toEqual({
      ok: true,
      blocks: TURN,
    });
  });

  it('accepts fewer streamed calls than tool_use blocks (the per-response cap)', () => {
    const state = encodeProviderState(TURN);
    expect(rebuildAssistantTurn('One. Two.', [OPEN_EMAIL], state).ok).toBe(true);
  });

  it('keeps edited content in one text block instead of failing', () => {
    const rebuilt = rebuildAssistantTurn('Edited', [SCROLL_IMPACT], encodeProviderState(TURN));
    expect(rebuilt.ok && rebuilt.blocks.filter((b) => b.type === 'text')).toEqual([
      { type: 'text', text: 'Edited' },
    ]);
  });

  it('rejects a state that does not match the calls or is malformed', () => {
    const state = encodeProviderState(TURN);
    const other = { ...SCROLL_IMPACT, input: { section: 'about' } };
    expect(rebuildAssistantTurn('One. Two.', [other], state)).toMatchObject({ ok: false });
    expect(rebuildAssistantTurn('One. Two.', [OPEN_EMAIL, SCROLL_IMPACT], state)).toMatchObject({
      ok: false,
    });
    expect(
      rebuildAssistantTurn('x', [SCROLL_IMPACT], '{"v":1,"blocks":[{"type":"server_tool_use"}]}'),
    ).toMatchObject({ ok: false });
    expect(rebuildAssistantTurn('x', [SCROLL_IMPACT], 'nope')).toMatchObject({ ok: false });
  });

  it('builds the turn from content and calls without a state', () => {
    expect(rebuildAssistantTurn('', [SCROLL_IMPACT], undefined)).toEqual({
      ok: true,
      blocks: [{ type: 'tool_use', ...SCROLL_IMPACT }],
    });
  });

  it('omits a state over 16,384 characters', () => {
    const big: LlmAssistantBlock[] = [
      { type: 'thinking', thinking: 'x'.repeat(16_384), signature: 's' },
      { type: 'tool_use', ...SCROLL_IMPACT },
    ];
    expect(encodeProviderState(big)).toBeUndefined();
  });
});
