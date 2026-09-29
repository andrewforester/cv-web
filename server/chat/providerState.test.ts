import { describe, expect, it } from 'vitest';
import { SCROLL_APPS } from '../test/helpers.js';
import type { LlmAssistantBlock } from './llm/LlmClient.js';
import { encodeProviderState, rebuildAssistantTurn } from './providerState.js';

const SWITCH_UK = { id: 'toolu_2', name: 'switchLanguage' as const, input: { locale: 'uk' } };
const TURN: LlmAssistantBlock[] = [
  { type: 'thinking', thinking: 'Plan', signature: 'sig' },
  { type: 'text', text: 'One. ' },
  { type: 'redacted_thinking', data: 'enc' },
  { type: 'text', text: 'Two.' },
  { type: 'tool_use', ...SCROLL_APPS },
  { type: 'tool_use', ...SWITCH_UK },
];

describe('providerState', () => {
  it('round-trips the turn: non-text blocks unchanged, text from content, same order', () => {
    const state = encodeProviderState(TURN);
    expect(state).not.toContain('One.');
    expect(rebuildAssistantTurn('One. Two.', [SCROLL_APPS, SWITCH_UK], state)).toEqual({
      ok: true,
      blocks: TURN,
    });
  });

  it('accepts fewer streamed calls than tool_use blocks (the per-response cap)', () => {
    const state = encodeProviderState(TURN);
    expect(rebuildAssistantTurn('One. Two.', [SWITCH_UK], state).ok).toBe(true);
  });

  it('keeps edited content in one text block instead of failing', () => {
    const rebuilt = rebuildAssistantTurn('Edited', [SCROLL_APPS], encodeProviderState(TURN));
    expect(rebuilt.ok && rebuilt.blocks.filter((b) => b.type === 'text')).toEqual([
      { type: 'text', text: 'Edited' },
    ]);
  });

  it('rejects a state that does not match the calls or is malformed', () => {
    const state = encodeProviderState(TURN);
    const other = { ...SCROLL_APPS, input: { section: 'about' } };
    expect(rebuildAssistantTurn('One. Two.', [other], state)).toMatchObject({ ok: false });
    expect(rebuildAssistantTurn('One. Two.', [SWITCH_UK, SCROLL_APPS], state)).toMatchObject({
      ok: false,
    });
    expect(
      rebuildAssistantTurn('x', [SCROLL_APPS], '{"v":1,"blocks":[{"type":"server_tool_use"}]}'),
    ).toMatchObject({ ok: false });
    expect(rebuildAssistantTurn('x', [SCROLL_APPS], 'nope')).toMatchObject({ ok: false });
  });

  it('builds the turn from content and calls without a state', () => {
    expect(rebuildAssistantTurn('', [SCROLL_APPS], undefined)).toEqual({
      ok: true,
      blocks: [{ type: 'tool_use', ...SCROLL_APPS }],
    });
  });

  it('omits a state over 16,384 characters', () => {
    const big: LlmAssistantBlock[] = [
      { type: 'thinking', thinking: 'x'.repeat(16_384), signature: 's' },
      { type: 'tool_use', ...SCROLL_APPS },
    ];
    expect(encodeProviderState(big)).toBeUndefined();
  });
});
