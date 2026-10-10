import { useCallback, useEffect, useReducer, useRef, type Dispatch } from 'react';
import {
  CHAT_API_VERSION_V4,
  CHAT_LIMITS_V2,
  useChatRepository,
  type AgentPageStateV4,
  type AgentToolCall,
  type ChatError,
  type ChatMessageV4,
  type ChatRequestV4,
} from '../../data/chat';
import { useCvPageRepository } from '../../data';
import { useAgentRegistry } from '../../agent';
import { useStrings } from '../../i18n';
import { useAgentExecutor } from './agentExecutor';
import type { ChatAnnouncementInput, ChatEntry } from './ChatUiState';
import { conversationReducer, isBusy, textTurns, type ConversationAction } from './conversation';
import { buildMessages, retryMessages } from './conversationRequests';
import { loadPageContent } from './pageContent';
import { useConfirmationDecisions } from './useConfirmationDecisions';
import { runToolCalls } from './runToolCalls';
import { chatStrings } from './strings';

export interface Conversation {
  /** Text turns and voice calls, in order. */
  entries: readonly ChatEntry[];
  busy: boolean;
  /** Page tools are mounted right now. */
  commandsAvailable: boolean;
  ask(question: string): void;
  retry(): void;
  stop(): void;
  reset(): void;
  confirmAction(callId: string): void;
  declineAction(callId: string): void;
  /** Records a voice call's events (the call's state holder writes its transcript here). */
  record: Dispatch<ConversationAction>;
}

interface ConversationOptions {
  announce: (announcement: ChatAnnouncementInput) => void;
  /** The chat is the phone's bottom sheet (the page snapshot says so). */
  sheet: boolean;
}

const streamEndedEarly: ChatError = {
  code: 'upstream_error',
  message: 'Stream ended early',
  retryable: true,
};
const tooManyRounds: ChatError = {
  code: 'internal_error',
  message: 'Tool round limit exceeded',
  retryable: false,
};

/**
 * Drives the conversation on the one page (API.md → v4): sends the completed history + the
 * question through `ChatRepository`, appends streamed deltas, and runs the model's page tools
 * client-side (AGENT.md §4): after a `done: tool_use` the calls run in order, the results go back
 * in a follow-up request, at most `maxToolRoundsPerTurn` times. Stop (abort) drops the turn; a
 * retry re-sends the finished rounds and never runs their tools again. A running turn keeps going
 * while the panel is closed; unmount aborts it.
 */
export function useChatConversation({ announce, sheet }: ConversationOptions): Conversation {
  const repository = useChatRepository();
  const cvPageRepository = useCvPageRepository();
  const executor = useAgentExecutor();
  const registry = useAgentRegistry();
  const strings = useStrings(chatStrings);
  const [entries, dispatch] = useReducer(conversationReducer, []);
  const controller = useRef<AbortController | null>(null);
  const nextId = useRef(0);
  const commandsAvailable = executor.available().length > 0;

  useEffect(() => () => controller.current?.abort(), []);

  const pageState = useCallback((): AgentPageStateV4 => {
    return {
      viewport: sheet ? 'mobile' : 'desktop',
      chat: sheet ? 'sheet' : 'card',
      ...registry.view(),
      tools: executor.available(),
    };
  }, [sheet, registry, executor]);

  const { waitForDecision, confirmAction, declineAction } = useConfirmationDecisions();

  const run = useCallback(
    async (id: string, initial: ChatMessageV4[], finishedRounds: number) => {
      const current = new AbortController();
      const { signal } = current;
      controller.current = current;
      const messages = [...initial];
      let rounds = finishedRounds;
      const fail = (error: ChatError) => {
        dispatch({ type: 'fail', id, error });
        announce({ kind: 'error', code: error.code, retryable: error.retryable });
      };
      try {
        for (;;) {
          let answer = '';
          const calls: AgentToolCall[] = [];
          const request: ChatRequestV4 = { v: CHAT_API_VERSION_V4, messages: [...messages] };
          let terminal;
          for await (const event of repository.send(request, signal)) {
            if (signal.aborted) return;
            if (event.type === 'delta') {
              answer += event.text;
              dispatch({ type: 'delta', id, text: event.text });
            } else if (event.type === 'tool_call') {
              calls.push({ id: event.id, name: event.name, input: event.input });
            } else {
              terminal = event;
              break;
            }
          }
          if (signal.aborted) return;
          if (!terminal) return fail(streamEndedEarly);
          if (terminal.type === 'error') return fail(terminal.error);
          // Only a clean `tool_use` stop runs calls: a cut-off stream never runs a half-formed one.
          if (terminal.stopReason !== 'tool_use' || calls.length === 0) {
            const stopReason =
              terminal.stopReason === 'tool_use' ? 'end_turn' : terminal.stopReason;
            dispatch({ type: 'done', id, stopReason });
            announce({ kind: 'answer', text: answer, stopReason });
            return;
          }
          if (rounds >= CHAT_LIMITS_V2.maxToolRoundsPerTurn) return fail(tooManyRounds);

          const content = await loadPageContent(cvPageRepository);
          const results = await runToolCalls(calls, terminal.providerState, {
            turnId: id,
            executor,
            content,
            strings,
            signal,
            dispatch,
            announce,
            waitForDecision,
          });
          if (!results) return;
          rounds += 1;
          messages.push(
            {
              role: 'assistant',
              content: answer,
              toolCalls: calls,
              ...(terminal.providerState !== undefined && {
                providerState: terminal.providerState,
              }),
            },
            { role: 'user', toolResults: results },
          );
          dispatch({ type: 'resume', id });
          announce({ kind: 'typing' });
        }
      } catch {
        // The repository never throws by contract; treat a bug like a broken stream.
        if (!signal.aborted) fail(streamEndedEarly);
      } finally {
        if (controller.current === current) controller.current = null;
      }
    },
    [repository, cvPageRepository, executor, strings, announce, waitForDecision],
  );

  const busy = isBusy(entries);

  const ask = useCallback(
    (question: string) => {
      if (busy) return;
      const id = `turn-${++nextId.current}`;
      const snapshot = pageState();
      dispatch({ type: 'ask', id, question, page: snapshot });
      announce({ kind: 'typing' });
      void run(id, buildMessages(entries, question, snapshot), 0);
    },
    [busy, entries, pageState, run, announce],
  );

  const retry = useCallback(() => {
    const last = entries.at(-1);
    if (last?.kind !== 'turn' || last.status !== 'error') return;
    dispatch({ type: 'retry', id: last.id });
    announce({ kind: 'typing' });
    void run(last.id, retryMessages(entries.slice(0, -1), last), last.rounds.length);
  }, [entries, run, announce]);

  const stop = useCallback(() => {
    const active = textTurns(entries).find((turn) => isBusy([turn]));
    if (!active) return;
    controller.current?.abort();
    dispatch({ type: 'stop', id: active.id });
    announce({ kind: 'stopped' });
  }, [entries, announce]);

  const reset = useCallback(() => {
    controller.current?.abort();
    dispatch({ type: 'reset' });
  }, []);

  return {
    entries,
    busy,
    commandsAvailable,
    ask,
    retry,
    stop,
    reset,
    confirmAction,
    declineAction,
    record: dispatch,
  };
}
