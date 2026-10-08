import { CHAT_LIMITS_V2, type AgentPageStateV4 } from '../../data/chat';
import type { ChatActionCall, ChatToolRound, ChatTurn } from './ChatUiState';
import { conversationReducer, textTurns } from './conversation';
import {
  buildHistory,
  buildMessages,
  exceedsConversationLimits,
  retryMessages,
  turnMessages,
} from './conversationRequests';
import type { ChatVoiceCall } from './voice/callReducer';

const page: AgentPageStateV4 = {
  viewport: 'desktop',
  chat: 'card',
  activeSection: null,
  highlighted: null,
  tools: ['scrollToSection'],
};

const turn = (
  id: string,
  question: string,
  answer: string,
  status: ChatTurn['status'] = 'done',
  rounds: ChatToolRound[] = [],
): ChatTurn => ({
  kind: 'turn',
  id,
  question,
  page,
  rounds,
  answer,
  status,
  stopReason: 'end_turn',
});

const call = { id: 'toolu_1', name: 'scrollToSection', input: { section: 'apps' } } as const;
const action: ChatActionCall = {
  call,
  status: 'finished',
  result: { ok: true },
};
const round: ChatToolRound = { text: 'Scrolling.', providerState: 'opaque', actions: [action] };

describe('conversation', () => {
  it('sends only completed turns, then the new question with its page snapshot', () => {
    const history = [
      turn('1', 'Q1', 'A1'),
      turn('2', 'Q2', 'partial', 'stopped'),
      turn('3', 'Q3', 'oops', 'error'),
      turn('4', 'Q4', '  '),
      turn('5', 'Q5', 'A5'),
    ];
    expect(buildMessages(history, 'Q6', page)).toEqual([
      { role: 'user', content: 'Q1', page },
      { role: 'assistant', content: 'A1' },
      { role: 'user', content: 'Q5', page },
      { role: 'assistant', content: 'A5' },
      { role: 'user', content: 'Q6', page },
    ]);
  });

  it('replays tool rounds: assistant turn with providerState, then the results', () => {
    expect(buildHistory([turn('1', 'Show apps', 'Done.', 'done', [round])])).toEqual([
      { role: 'user', content: 'Show apps', page },
      { role: 'assistant', content: 'Scrolling.', toolCalls: [call], providerState: 'opaque' },
      { role: 'user', toolResults: [{ callId: 'toolu_1', result: { ok: true } }] },
      { role: 'assistant', content: 'Done.' },
    ]);
  });

  it('a retry re-sends the finished rounds without a final answer', () => {
    const failed = turn('1', 'Show apps', '', 'error', [round]);
    expect(turnMessages(failed)).toHaveLength(3);
    expect(turnMessages(failed).at(-1)).toMatchObject({
      role: 'user',
      toolResults: expect.any(Array),
    });
  });

  it('is full at 10 questions, 40 messages or 32,000 characters', () => {
    const nine = Array.from({ length: 9 }, (_, i) => turn(String(i), 'q', 'a'));
    expect(exceedsConversationLimits(nine, 'q')).toBe(false);
    expect(exceedsConversationLimits([...nine, turn('10', 'q', 'a')], 'q')).toBe(true);
    const busy = Array.from({ length: 6 }, (_, i) =>
      turn(String(i), 'q', 'a', 'done', [round, round]),
    );
    // 6 questions x (1 + 2 rounds x 2 + 1) = 36 messages: one more question makes 37, still fine.
    expect(exceedsConversationLimits(busy, 'q')).toBe(false);
    expect(
      exceedsConversationLimits([...busy, turn('7', 'q', 'a', 'done', [round, round])], 'q'),
    ).toBe(true);
    expect(exceedsConversationLimits([turn('1', 'q', 'a'.repeat(31_995))], 'question')).toBe(true);
  });

  it('streams, finishes, fails, retries and ignores events of finished turns', () => {
    let turns = conversationReducer([], { type: 'ask', id: 't', question: 'Q', page });
    turns = conversationReducer(turns, { type: 'delta', id: 't', text: 'He' });
    turns = conversationReducer(turns, { type: 'delta', id: 't', text: 'llo' });
    expect(turns[0]).toMatchObject({ answer: 'Hello', status: 'streaming' });
    const error = { code: 'upstream_error' as const, message: 'x', retryable: true };
    turns = conversationReducer(turns, { type: 'fail', id: 't', error });
    turns = conversationReducer(turns, { type: 'delta', id: 't', text: 'late' });
    expect(turns[0]).toMatchObject({ answer: 'Hello', status: 'error', error });
    turns = conversationReducer(turns, { type: 'retry', id: 't' });
    expect(turns[0]).toMatchObject({ answer: '', status: 'pending', error: undefined });
    turns = conversationReducer(turns, { type: 'done', id: 't', stopReason: 'end_turn' });
    expect(turns[0]?.status).toBe('done');
    expect(conversationReducer(turns, { type: 'reset' })).toEqual([]);
  });

  it('turns streamed text and calls into a round, updates a call and resumes', () => {
    const running: ChatActionCall = { call, status: 'running' };
    let turns = conversationReducer([], { type: 'ask', id: 't', question: 'Q', page });
    turns = conversationReducer(turns, { type: 'delta', id: 't', text: 'Scrolling.' });
    turns = conversationReducer(turns, {
      type: 'round',
      id: 't',
      providerState: 'p',
      actions: [running],
    });
    expect(turns[0]).toMatchObject({ answer: '', status: 'acting' });
    expect(textTurns(turns)[0]?.rounds[0]).toMatchObject({
      text: 'Scrolling.',
      providerState: 'p',
    });
    turns = conversationReducer(turns, {
      type: 'action',
      id: 't',
      callId: 'toolu_1',
      patch: { status: 'finished', result: { ok: true } },
    });
    expect(textTurns(turns)[0]?.rounds[0]?.actions[0]).toMatchObject({
      status: 'finished',
      result: { ok: true },
    });
    turns = conversationReducer(turns, { type: 'resume', id: 't' });
    expect(turns[0]?.status).toBe('pending');
    // A stopped turn ignores late tool events.
    turns = conversationReducer(turns, { type: 'stop', id: 't' });
    turns = conversationReducer(turns, { type: 'round', id: 't', actions: [running] });
    expect(textTurns(turns)[0]?.rounds).toHaveLength(1);
  });

  it('records a voice call in order and sends its lines with the next question', () => {
    let entries = conversationReducer([turn('1', 'Q1', 'A1')], { type: 'callStart', id: 'c' });
    const line = (id: string, role: 'visitor' | 'agent', text: string) =>
      ({ type: 'callLine', id: 'c', line: { id, role, text } }) as const;
    entries = conversationReducer(entries, line('visitor-1', 'visitor', 'Show his impact'));
    entries = conversationReducer(entries, {
      type: 'callAction',
      id: 'c',
      action: { call, status: 'running' },
    });
    entries = conversationReducer(entries, {
      type: 'callActionPatch',
      id: 'c',
      callId: 'toolu_1',
      patch: { status: 'finished', result: { ok: true } },
    });
    entries = conversationReducer(
      entries,
      line('agent-2', 'agent', 'Here is his impact, and more'),
    );
    entries = conversationReducer(entries, {
      type: 'callCorrection',
      id: 'c',
      lineId: 'agent-2',
      text: 'Here is his impact',
    });
    const waiting = { ...call, id: 'toolu_2', name: 'openContact' as const };
    entries = conversationReducer(entries, {
      type: 'callAction',
      id: 'c',
      action: { call: waiting, status: 'awaiting' },
    });
    entries = conversationReducer(entries, {
      type: 'callEnd',
      id: 'c',
      reason: 'visitor',
      durationSec: 42,
    });
    // An ended call ignores late lines.
    entries = conversationReducer(entries, line('agent-3', 'agent', 'late'));

    expect(entries[1]).toEqual({
      kind: 'call',
      id: 'c',
      status: 'ended',
      endReason: 'visitor',
      durationSec: 42,
      items: [
        { kind: 'line', id: 'visitor-1', role: 'visitor', text: 'Show his impact' },
        { kind: 'action', action: { call, status: 'finished', result: { ok: true } } },
        { kind: 'line', id: 'agent-2', role: 'agent', text: 'Here is his impact' },
        // A card still waiting when the call ended is settled as declined.
        {
          kind: 'action',
          action: { call: waiting, status: 'finished', result: { ok: false, error: 'declined' } },
        },
      ],
    });
    // Lines only, as corrected; the tool chips stay in the chat.
    expect(buildMessages(entries, 'Q2', page)).toEqual([
      { role: 'user', content: 'Q1', page },
      { role: 'assistant', content: 'A1' },
      {
        role: 'user',
        content: 'Q2',
        page,
        voiceCalls: [
          {
            lines: [
              { role: 'visitor', text: 'Show his impact' },
              { role: 'agent', text: 'Here is his impact' },
            ],
          },
        ],
      },
    ]);
    expect(conversationReducer(entries, { type: 'reset' })).toEqual([]);
  });
});

/** An ended call with these lines (`v…` the visitor's, the rest the agent's). */
const voiceCall = (id: string, ...texts: string[]): ChatVoiceCall => ({
  kind: 'call',
  id,
  status: 'ended',
  endReason: 'visitor',
  durationSec: 30,
  items: texts.map((text, index) => ({
    kind: 'line',
    id: `${id}-${index}`,
    role: text.trim().startsWith('v') ? 'visitor' : 'agent',
    text,
  })),
});

const sent = (...texts: string[]) => ({
  lines: texts.map((text) => ({ role: text.startsWith('v') ? 'visitor' : 'agent', text })),
});

describe('voice calls in the history', () => {
  it('each question carries the calls since the previous one; the new one the trailing calls', () => {
    const history = [
      voiceCall('c1', 'v1', 'a1'),
      turn('1', 'Q1', 'A1'),
      voiceCall('c2', 'v2'),
      voiceCall('c3', 'a3'),
      turn('2', 'Q2', 'A2'),
      voiceCall('c4', 'v4', 'a4'),
    ];
    expect(buildMessages(history, 'Q3', page)).toEqual([
      { role: 'user', content: 'Q1', page, voiceCalls: [sent('v1', 'a1')] },
      { role: 'assistant', content: 'A1' },
      { role: 'user', content: 'Q2', page, voiceCalls: [sent('v2'), sent('a3')] },
      { role: 'assistant', content: 'A2' },
      { role: 'user', content: 'Q3', page, voiceCalls: [sent('v4', 'a4')] },
    ]);
  });

  it('skips calls without lines and blank lines; no field when nothing is left', () => {
    const toolOnly: ChatVoiceCall = {
      ...voiceCall('c2'),
      items: [{ kind: 'action', action }],
    };
    const history = [voiceCall('c1', '  '), toolOnly, voiceCall('c3', 'v3', ' ')];
    expect(buildMessages(history, 'Q', page)).toEqual([
      { role: 'user', content: 'Q', page, voiceCalls: [sent('v3')] },
    ]);
    expect(buildMessages([voiceCall('c1', ' '), toolOnly], 'Q', page)).toEqual([
      { role: 'user', content: 'Q', page },
    ]);
  });

  it('calls before a stopped or failed turn move on to the next question sent', () => {
    const history = [
      voiceCall('c1', 'v1'),
      turn('1', 'Q1', 'partial', 'stopped'),
      voiceCall('c2', 'v2'),
      turn('2', 'Q2', 'oops', 'error'),
    ];
    expect(buildMessages(history, 'Q3', page)).toEqual([
      { role: 'user', content: 'Q3', page, voiceCalls: [sent('v1'), sent('v2')] },
    ]);
  });

  it('a retry re-sends the failed question with the same calls and its finished rounds', () => {
    const before = [turn('1', 'Q1', 'A1'), voiceCall('c1', 'v1')];
    const failed = turn('2', 'Show apps', '', 'error', [round]);
    const first = buildMessages(before, 'Show apps', page);
    const retry = retryMessages(before, failed);
    expect(retry.slice(0, first.length)).toEqual(first);
    expect(retry.slice(first.length)).toEqual([
      { role: 'assistant', content: 'Scrolling.', toolCalls: [call], providerState: 'opaque' },
      { role: 'user', toolResults: [{ callId: 'toolu_1', result: { ok: true } }] },
    ]);
  });

  it('keeps the latest calls and each call’s last lines within the API caps', () => {
    const { maxVoiceCallsPerQuestion, maxVoiceCallLines, maxVoiceLineChars, maxVoiceCallChars } =
      CHAT_LIMITS_V2;
    const calls = Array.from({ length: maxVoiceCallsPerQuestion + 1 }, (_, i) =>
      voiceCall(`c${i}`, `v${i}`),
    );
    const [question] = buildMessages(calls, 'Q', page);
    expect(question).toMatchObject({ voiceCalls: calls.slice(1).map((_, i) => sent(`v${i + 1}`)) });

    const many = Array.from({ length: maxVoiceCallLines + 5 }, (_, i) => `v${i}`);
    const [longCall] = buildMessages([voiceCall('c', ...many)], 'Q', page);
    expect(longCall).toMatchObject({ voiceCalls: [sent(...many.slice(5))] });

    const long = 'v'.repeat(maxVoiceLineChars + 200);
    const [cutLine] = buildMessages([voiceCall('c', ` ${long} `)], 'Q', page);
    expect(cutLine).toMatchObject({ voiceCalls: [sent(long.slice(0, maxVoiceLineChars))] });

    // 5 lines of 1,000 chars: only the last 4 fit 4,000.
    const full = Array.from({ length: 5 }, (_, i) => `v${i}`.padEnd(maxVoiceLineChars, '.'));
    const [fullCall] = buildMessages([voiceCall('c', ...full)], 'Q', page);
    expect(fullCall).toMatchObject({ voiceCalls: [sent(...full.slice(1))] });
    expect(maxVoiceCallChars).toBe(4 * maxVoiceLineChars);
  });

  it('counts the voice text sent toward the 32,000 characters', () => {
    const line = 'v'.padEnd(1_000, '.');
    // Three calls of 4,000 chars before each of two questions (24,000) and 7,001 of text.
    const calls = (n: number) =>
      Array.from({ length: 3 }, (_, i) => voiceCall(`c${n}-${i}`, line, line, line, line));
    const history = [...calls(1), turn('1', 'q', 'a'.repeat(7_000)), ...calls(2)];
    expect(exceedsConversationLimits(history, 'q'.repeat(999))).toBe(false);
    expect(exceedsConversationLimits(history, 'q'.repeat(1_000))).toBe(true);
    // Calls never count as questions.
    expect(exceedsConversationLimits([...calls(1), ...calls(2)], 'q')).toBe(false);
  });
});
