import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  CHAT_API_VERSION_V2,
  CHAT_LIMITS_V2,
  CHAT_PAGE_ROUTES,
  useChatRepository,
  type AgentPageState,
  type AgentToolCall,
  type ChatError,
  type ChatLocale,
  type ChatMessageV2,
  type ChatPage,
  type ChatRequestV2,
} from '../../data/chat';
import { useCvRepository, useProfileRepository } from '../../data';
import { useLocale, useStrings } from '../../i18n';
import { useAgentExecutor } from './agentExecutor';
import type { ChatAnnouncementInput, ChatTurn } from './ChatUiState';
import {
  buildHistory,
  buildMessages,
  conversationReducer,
  isBusy,
  turnMessages,
} from './conversation';
import { loadPageContent } from './pageContent';
import { useConfirmationDecisions } from './useConfirmationDecisions';
import { runToolCalls, VISUAL_TOOLS } from './runToolCalls';
import { chatStrings } from './strings';

export interface Conversation {
  turns: readonly ChatTurn[];
  busy: boolean;
  /** Page tools are mounted right now. */
  commandsAvailable: boolean;
  ask(question: string): void;
  retry(): void;
  stop(): void;
  reset(): void;
  confirmAction(callId: string): void;
  declineAction(callId: string): void;
}

interface ConversationOptions {
  /** The page the chat is on: sent with every request; its data backs chips and confirmations. */
  page: ChatPage;
  announce: (announcement: ChatAnnouncementInput) => void;
  /** The chat is the full-screen sheet: visual page actions close it (the conversation stays). */
  sheet: boolean;
  closeSheet: () => void;
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
 * Drives the conversation: sends the completed history + the question through `ChatRepository`,
 * appends streamed deltas, and runs the model's page tools client-side (AGENT.md §4): after a
 * `done: tool_use` the calls run in order, the results go back in a follow-up request, at most
 * `maxToolRoundsPerTurn` times. Stop (abort) drops the turn; a retry re-sends the finished rounds
 * and never runs their tools again. A running turn keeps going while the panel is closed;
 * unmount aborts it.
 */
export function useChatConversation({
  page,
  announce,
  sheet,
  closeSheet,
}: ConversationOptions): Conversation {
  const repository = useChatRepository();
  const cvRepository = useCvRepository();
  const profileRepository = useProfileRepository();
  const executor = useAgentExecutor();
  const { locale } = useLocale();
  const strings = useStrings(chatStrings);
  const [turns, dispatch] = useReducer(conversationReducer, []);
  const controller = useRef<AbortController | null>(null);
  const nextId = useRef(0);
  const commandsAvailable = executor.available().length > 0;

  // The async loop outlives renders: it reads what changed (sheet layout, callbacks) from here.
  const latest = useRef({ sheet, closeSheet });
  useEffect(() => {
    latest.current = { sheet, closeSheet };
  });
  useEffect(() => () => controller.current?.abort(), []);

  const pageState = useCallback(
    (): AgentPageState => ({
      route: CHAT_PAGE_ROUTES[page],
      locale,
      viewport: sheet ? 'mobile' : 'desktop',
      chat: sheet ? 'sheet' : 'card',
      // TODO(GRA-34): the registry exposes the section in view and the highlighted target.
      activeSection: null,
      highlighted: null,
      tools: executor.available(),
    }),
    [page, locale, sheet, executor],
  );

  const { waitForDecision, confirmAction, declineAction } = useConfirmationDecisions();

  const run = useCallback(
    async (id: string, initial: ChatMessageV2[], finishedRounds: number) => {
      const current = new AbortController();
      const { signal } = current;
      controller.current = current;
      const messages = [...initial];
      let rounds = finishedRounds;
      let requestLocale: ChatLocale = locale;
      const fail = (error: ChatError) => {
        dispatch({ type: 'fail', id, error });
        announce({ kind: 'error', code: error.code, retryable: error.retryable });
      };
      try {
        for (;;) {
          let answer = '';
          const calls: AgentToolCall[] = [];
          const request: ChatRequestV2 = {
            v: CHAT_API_VERSION_V2,
            locale: requestLocale,
            page,
            messages: [...messages],
          };
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

          const content = await loadPageContent(page, locale, {
            cv: cvRepository,
            profile: profileRepository,
          });
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
          calls.forEach((call, index) => {
            if (!results[index]?.result.ok) return;
            if (call.name === 'switchLanguage') requestLocale = call.input.locale as ChatLocale;
          });
          if (
            latest.current.sheet &&
            calls.some((call, i) => VISUAL_TOOLS.includes(call.name) && results[i]?.result.ok)
          ) {
            latest.current.closeSheet();
          }
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
    [
      repository,
      page,
      cvRepository,
      profileRepository,
      executor,
      locale,
      strings,
      announce,
      waitForDecision,
    ],
  );

  const busy = isBusy(turns);

  const ask = useCallback(
    (question: string) => {
      if (busy) return;
      const id = `turn-${++nextId.current}`;
      const snapshot = pageState();
      dispatch({ type: 'ask', id, question, page: snapshot });
      announce({ kind: 'typing' });
      void run(id, buildMessages(turns, question, snapshot), 0);
    },
    [busy, turns, pageState, run, announce],
  );

  const retry = useCallback(() => {
    const last = turns.at(-1);
    if (!last || last.status !== 'error') return;
    dispatch({ type: 'retry', id: last.id });
    announce({ kind: 'typing' });
    void run(
      last.id,
      [...buildHistory(turns.slice(0, -1)), ...turnMessages(last)],
      last.rounds.length,
    );
  }, [turns, run, announce]);

  const stop = useCallback(() => {
    const active = turns.find((turn) => isBusy([turn]));
    if (!active) return;
    controller.current?.abort();
    dispatch({ type: 'stop', id: active.id });
    announce({ kind: 'stopped' });
  }, [turns, announce]);

  const reset = useCallback(() => {
    controller.current?.abort();
    dispatch({ type: 'reset' });
  }, []);

  return { turns, busy, commandsAvailable, ask, retry, stop, reset, confirmAction, declineAction };
}
