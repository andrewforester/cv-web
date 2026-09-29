import { describe, expect, it } from 'vitest';
import { question, toolResults, toolTurn, v2Body } from '../../test/helpers.js';
import { buildLlmRequest } from '../prompt/buildLlmRequest.js';
import { validateChatRequest } from '../validate.js';
import { devFakeScript } from './devFakeScript.js';
import { HAIKU_4_5 } from './modelOptions.js';

function scriptFor(body: unknown) {
  const result = validateChatRequest(body);
  if (!result.ok) throw new Error(result.error.message);
  return devFakeScript(buildLlmRequest(result.request, 'K', HAIKU_4_5));
}

describe('devFakeScript: v2 tool rounds', () => {
  it('turns a page command into a tool call after one sentence', () => {
    expect(scriptFor(v2Body(question('Show me his apps')))).toMatchObject({
      deltas: ['Sure, ', 'doing ', 'it ', 'now.'],
      toolCalls: [{ id: 'toolu_fake_1_0', name: 'scrollToSection', input: { section: 'apps' } }],
    });
    expect(scriptFor(v2Body(question('Перемкни на українську')))).toMatchObject({
      toolCalls: [{ name: 'switchLanguage', input: { locale: 'uk' } }],
    });
  });

  it('parses /tool commands, dropping unknown tools', () => {
    const script = scriptFor(
      v2Body(question('/tool switchLanguage=uk nope=1 highlightElement=app:cync')),
    );
    expect(script.toolCalls).toEqual([
      { id: 'toolu_fake_1_0', name: 'switchLanguage', input: { locale: 'uk' } },
      { id: 'toolu_fake_1_2', name: 'highlightElement', input: { target: 'app:cync' } },
    ]);
  });

  it('answers the results in text, and a failure as such', () => {
    const ok = scriptFor(v2Body(question('Show me his apps'), toolTurn(), toolResults()));
    expect(ok).toMatchObject({ deltas: ['Done.'] });
    expect(ok.toolCalls).toBeUndefined();
    const failed = scriptFor(
      v2Body(question('Show me his apps'), toolTurn(), {
        role: 'user',
        toolResults: [{ callId: 'toolu_1', result: { ok: false, error: 'not_available' } }],
      }),
    );
    expect(failed.deltas.join('')).toBe("That didn't work on this page.");
  });

  it('answers ordinary questions and v1 as before', () => {
    expect(scriptFor(v2Body(question('What does he do?'))).toolCalls).toBeUndefined();
    expect(
      scriptFor({ v: 1, locale: 'en', messages: [{ role: 'user', content: 'Show me his apps' }] })
        .toolCalls,
    ).toBeUndefined();
  });
});
