import { describe, expect, it } from 'vitest';
import { questionV4, toolResults, toolTurn, v4Body } from '../../test/helpers.js';
import { buildLlmRequest } from '../prompt/buildLlmRequest.js';
import { validateChatRequest } from '../validate.js';
import { DEV_ANSWERS } from './devFakeAnswers.js';
import { devFakeScript } from './devFakeScript.js';
import { HAIKU_4_5 } from './modelOptions.js';

function scriptFor(body: unknown) {
  const result = validateChatRequest(body);
  if (!result.ok) throw new Error(result.error.message);
  return devFakeScript(buildLlmRequest(result.request, 'K', HAIKU_4_5));
}

describe('devFakeScript: tool rounds', () => {
  it('turns a page command into a tool call after one sentence', () => {
    expect(scriptFor(v4Body(questionV4('Show me his impact')))).toMatchObject({
      deltas: ['Sure, ', 'doing ', 'it ', 'now.'],
      toolCalls: [{ id: 'toolu_fake_1_0', name: 'scrollToSection', input: { section: 'impact' } }],
    });
    expect(scriptFor(v4Body(questionV4('Open his LinkedIn')))).toMatchObject({
      toolCalls: [{ name: 'openContact', input: { channel: 'linkedin' } }],
    });
  });

  it('parses /tool commands, dropping unknown tools', () => {
    const script = scriptFor(
      v4Body(questionV4('/tool openContact=email nope=1 highlightElement=app:cync')),
    );
    expect(script.toolCalls).toEqual([
      { id: 'toolu_fake_1_0', name: 'openContact', input: { channel: 'email' } },
      { id: 'toolu_fake_1_2', name: 'highlightElement', input: { target: 'app:cync' } },
    ]);
  });

  it('answers the results in text, and a failure as such', () => {
    const ok = scriptFor(v4Body(questionV4('Show me his impact'), toolTurn(), toolResults()));
    expect(ok).toMatchObject({ deltas: ['Done.'] });
    expect(ok.toolCalls).toBeUndefined();
    const failed = scriptFor(
      v4Body(questionV4('Show me his impact'), toolTurn(), {
        role: 'user',
        toolResults: [{ callId: 'toolu_1', result: { ok: false, error: 'not_available' } }],
      }),
    );
    expect(failed.deltas.join('')).toBe("That didn't work on this page.");
  });

  it('answers ordinary questions in text', () => {
    expect(scriptFor(v4Body(questionV4('What does he do?'))).toolCalls).toBeUndefined();
    expect(scriptFor(v4Body(questionV4('Message him on Telegram'))).toolCalls).toBeUndefined();
  });
});

/** A conversation of `count` plain questions, each answered in text, ending with a question. */
function conversation(count: number) {
  return v4Body(
    ...Array.from({ length: count }, (_, index) => [
      ...(index > 0 ? [{ role: 'assistant' as const, content: 'An answer.' }] : []),
      questionV4(`Question ${index + 1}`),
    ]).flat(),
  );
}

describe('devFakeScript: demo answers', () => {
  it('cycles through the canned answers, then a scroll round, by question count', () => {
    const texts = [1, 2, 3].map((count) => scriptFor(conversation(count)).deltas.join(''));
    expect(texts).toEqual(DEV_ANSWERS);
    const fourth = scriptFor(conversation(4));
    expect(fourth.toolCalls).toEqual([
      { id: 'toolu_fake_7_0', name: 'scrollToSection', input: { section: 'impact' } },
    ]);
    expect(scriptFor(conversation(5)).deltas.join('')).toBe(DEV_ANSWERS[0]);
  });

  it('does not count tool results as questions', () => {
    const body = conversation(1);
    body.messages.push(toolTurn(), toolResults(), { role: 'assistant', content: 'Done.' });
    body.messages.push(questionV4('Next question'));
    expect(scriptFor(body).deltas.join('')).toBe(DEV_ANSWERS[1]);
  });
});
