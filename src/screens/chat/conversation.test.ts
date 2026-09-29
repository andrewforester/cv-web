import type { ChatTurn } from './ChatUiState';
import { buildMessages, conversationReducer, exceedsConversationLimits } from './conversation';

const done = (id: string, question: string, answer: string): ChatTurn => ({
  id,
  question,
  answer,
  status: 'done',
  stopReason: 'end_turn',
});

describe('conversation', () => {
  it('sends only completed turns, then the new question', () => {
    const history: ChatTurn[] = [
      done('1', 'Q1', 'A1'),
      { id: '2', question: 'Q2', answer: 'partial', status: 'stopped' },
      { id: '3', question: 'Q3', answer: 'oops', status: 'error' },
      done('4', 'Q4', '  '),
      done('5', 'Q5', 'A5'),
    ];
    expect(buildMessages(history, 'Q6')).toEqual([
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: 'A1' },
      { role: 'user', content: 'Q5' },
      { role: 'assistant', content: 'A5' },
      { role: 'user', content: 'Q6' },
    ]);
  });

  it('is full when the next question would exceed 20 messages or 24,000 characters', () => {
    const nine = Array.from({ length: 9 }, (_, i) => done(String(i), 'q', 'a'));
    expect(exceedsConversationLimits(nine, 'q')).toBe(false);
    expect(exceedsConversationLimits([...nine, done('10', 'q', 'a')], 'q')).toBe(true);
    expect(exceedsConversationLimits([done('1', 'q', 'a'.repeat(23_995))], 'question')).toBe(true);
  });

  it('streams, finishes, fails, retries and ignores events of finished turns', () => {
    let turns = conversationReducer([], { type: 'ask', id: 't', question: 'Q' });
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
});
