import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  CHAT_API_VERSION,
  useChatRepository,
  type ChatMessage,
  type ChatRequest,
  type ChatStreamEvent,
} from '../../data/chat';
import { useLocale } from '../../i18n';
import type { ChatAnnouncementInput, ChatTurn } from './ChatUiState';
import { buildMessages, conversationReducer, isBusy } from './conversation';

type Announce = (announcement: ChatAnnouncementInput) => void;

export interface Conversation {
  turns: readonly ChatTurn[];
  busy: boolean;
  ask(question: string): void;
  retry(): void;
  stop(): void;
  reset(): void;
}

/**
 * Drives the conversation: sends completed history + the question through `ChatRepository`,
 * appends streamed deltas, handles Stop (abort), retry of the last failed turn and reset.
 * A running answer keeps streaming while the panel is closed; unmount aborts it.
 */
export function useChatConversation(announce: Announce): Conversation {
  const repository = useChatRepository();
  const { locale } = useLocale();
  const [turns, dispatch] = useReducer(conversationReducer, []);
  const controller = useRef<AbortController | null>(null);
  const nextId = useRef(0);

  useEffect(() => () => controller.current?.abort(), []);

  const stream = useCallback(
    async (id: string, messages: ChatMessage[]) => {
      const current = new AbortController();
      controller.current = current;
      let answer = '';
      const finish = (event: Exclude<ChatStreamEvent, { type: 'delta' }>) => {
        if (event.type === 'done') {
          dispatch({ type: 'done', id, stopReason: event.stopReason });
          announce({ kind: 'answer', text: answer, stopReason: event.stopReason });
        } else {
          dispatch({ type: 'fail', id, error: event.error });
          const { code, retryable } = event.error;
          announce({ kind: 'error', code, retryable });
        }
      };
      try {
        const request: ChatRequest = { v: CHAT_API_VERSION, locale, messages };
        for await (const event of repository.send(request, current.signal)) {
          if (current.signal.aborted) return;
          if (event.type !== 'delta') return finish(event);
          answer += event.text;
          dispatch({ type: 'delta', id, text: event.text });
        }
      } catch {
        // The repository never throws by contract; treat a bug like a broken stream below.
      } finally {
        if (controller.current === current) controller.current = null;
      }
      if (current.signal.aborted) return;
      finish({
        type: 'error',
        error: { code: 'upstream_error', message: 'Stream ended early', retryable: true },
      });
    },
    [repository, locale, announce],
  );

  const busy = isBusy(turns);

  const ask = useCallback(
    (question: string) => {
      if (busy) return;
      const id = `turn-${++nextId.current}`;
      dispatch({ type: 'ask', id, question });
      announce({ kind: 'typing' });
      void stream(id, buildMessages(turns, question));
    },
    [busy, turns, stream, announce],
  );

  const retry = useCallback(() => {
    const last = turns.at(-1);
    if (!last || last.status !== 'error') return;
    dispatch({ type: 'retry', id: last.id });
    announce({ kind: 'typing' });
    void stream(last.id, buildMessages(turns.slice(0, -1), last.question));
  }, [turns, stream, announce]);

  const stop = useCallback(() => {
    const active = turns.find((turn) => turn.status === 'pending' || turn.status === 'streaming');
    if (!active) return;
    controller.current?.abort();
    dispatch({ type: 'stop', id: active.id });
    announce({ kind: 'stopped' });
  }, [turns, announce]);

  const reset = useCallback(() => {
    controller.current?.abort();
    dispatch({ type: 'reset' });
  }, []);

  return { turns, busy, ask, retry, stop, reset };
}
