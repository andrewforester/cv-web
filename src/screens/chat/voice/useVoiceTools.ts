import { useCallback, type Dispatch } from 'react';
import { useCvPageRepository } from '../../../data';
import type { AgentToolCall, AgentToolResult } from '../../../data/chat';
import { useStrings } from '../../../i18n';
import { buildConfirmation, itemLabel } from '../actionLabels';
import { actionTarget, actionText } from '../actionText';
import { useAgentExecutor } from '../agentExecutor';
import type { ChatActionCall } from '../ChatUiState';
import type { ConversationAction } from '../conversation';
import { loadPageContent, type ChatPageContent } from '../pageContent';
import { VISUAL_TOOLS } from '../runToolCalls';
import { chatStrings } from '../strings';
import type { VoiceModelAction } from './voiceReducer';
import { sessionTimeout, type CallSession } from './voiceSession';

/** How long the contact card waits for a tap (docs/design/voice/SPEC.md → Layout 4). */
export const CONTACT_TAP_MS = 30_000;
/** The fog stays parted at least this long after a visual tool (`--agent-highlight-duration`). */
export const FOG_HOLD_MS = 3_000;
/** How long the "Opened WhatsApp" chip stays. */
const CHIP_MS = 3_000;

const OK: AgentToolResult = { ok: true };
const FAILED: AgentToolResult = { ok: false, error: 'failed' };

interface VoiceToolsOptions {
  record: Dispatch<ConversationAction>;
  dispatch: Dispatch<VoiceModelAction>;
  announce: (text: string) => void;
}

/**
 * The agent's page tools during a call (docs/voice/SYSTEM_DESIGN.md §7): each call runs through
 * the chat's executor, shows a chip in the voice mode and in the call's transcript, and parts the
 * fog while a visual tool shows the page. `openContact` comes after the agent's spoken yes: it
 * opens at once when the browser allows a new tab, otherwise a card asks for the tap.
 */
export function useVoiceTools({ record, dispatch, announce }: VoiceToolsOptions) {
  const executor = useAgentExecutor();
  const cvPageRepository = useCvPageRepository();
  const strings = useStrings(chatStrings);

  const execute = useCallback(
    (call: AgentToolCall) => executor.execute(call).catch(() => FAILED),
    [executor],
  );

  const openContact = useCallback(
    async (session: CallSession, action: ChatActionCall, content: ChatPageContent | null) => {
      const { call } = action;
      if (!executor.available().includes('openContact')) {
        return { ok: false, error: 'not_available' } as const;
      }
      const confirmation = buildConfirmation(call, content, strings);
      const contact = content?.contacts.find(({ id }) => id === String(call.input.channel));
      if (!confirmation || !contact) return { ok: false, error: 'unknown_target' } as const;
      if (!contact.href.startsWith('http')) return execute(call);
      // No `noopener` here: with it `window.open` always returns null, so a block can't be told.
      const opened = window.open(contact.href, '_blank');
      if (opened) {
        opened.opener = null;
        return OK;
      }
      const awaiting: ChatActionCall = { ...action, status: 'awaiting', confirmation };
      if (session.callId) {
        record({ type: 'callActionPatch', id: session.callId, callId: call.id, patch: awaiting });
      }
      const channel = actionTarget(action, strings);
      dispatch({ type: 'contact', contact: { ...confirmation, href: contact.href, channel } });
      announce(confirmation.title);
      const confirmed = await new Promise<boolean>((resolve) => {
        session.decide = resolve;
        sessionTimeout(session, () => resolve(false), CONTACT_TAP_MS);
      });
      session.decide = null;
      if (!session.finished) dispatch({ type: 'contact', contact: null });
      return confirmed ? OK : ({ ok: false, error: 'declined' } as const);
    },
    [executor, strings, execute, record, dispatch, announce],
  );

  const runTool = useCallback(
    async (session: CallSession, call: AgentToolCall): Promise<AgentToolResult> => {
      if (session.finished) return FAILED;
      const content = await loadPageContent(cvPageRepository);
      const visual = VISUAL_TOOLS.includes(call.name);
      const action: ChatActionCall = { call, label: itemLabel(call, content), status: 'running' };
      if (session.callId) record({ type: 'callAction', id: session.callId, action });
      if (visual) dispatch({ type: 'action', action, visual });
      const result =
        call.name === 'openContact'
          ? await openContact(session, action, content)
          : await execute(call);
      const finished: ChatActionCall = { ...action, status: 'finished', result };
      if (session.callId) {
        record({ type: 'callActionPatch', id: session.callId, callId: call.id, patch: finished });
      }
      if (session.finished) return result;
      dispatch({ type: 'action', action: finished, visual });
      announce(actionText(finished, strings));
      if (visual) session.toolAt = Date.now();
      else sessionTimeout(session, () => dispatch({ type: 'actionDone' }), CHIP_MS);
      return result;
    },
    [cvPageRepository, record, dispatch, openContact, execute, announce, strings],
  );

  /** The agent's turn ended (next *listening*): the fog closes, not sooner than 3 s after a tool. */
  const agentTurnEnded = useCallback(
    (session: CallSession) => {
      if (session.toolAt === null) return;
      const wait = Math.max(0, session.toolAt + FOG_HOLD_MS - Date.now());
      session.toolAt = null;
      sessionTimeout(session, () => dispatch({ type: 'actionDone' }), wait);
    },
    [dispatch],
  );

  return { runTool, agentTurnEnded };
}
