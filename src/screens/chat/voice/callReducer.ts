import type { VoiceEndReason, VoiceLineRole } from '../../../data/voice';
import type { ChatActionCall } from '../ChatUiState';

/** A final line of a call: what the visitor or the agent said. */
export interface ChatVoiceLine {
  readonly kind: 'line';
  readonly id: string;
  readonly role: VoiceLineRole;
  readonly text: string;
}

/** A page tool the agent ran during the call (a chip in the transcript). */
export interface ChatVoiceAction {
  readonly kind: 'action';
  readonly action: ChatActionCall;
}

export type ChatVoiceItem = ChatVoiceLine | ChatVoiceAction;

/**
 * A voice call in the chat's conversation (docs/voice/SYSTEM_DESIGN.md §8): its final lines and
 * tool chips in the order they happened. Created when the call goes live; `ended` keeps how it
 * ended and how long it ran. Its lines go to the text model with the next question
 * (`voiceHistory.ts`) and to the next call as the earlier conversation.
 */
export interface ChatVoiceCall {
  readonly kind: 'call';
  readonly id: string;
  readonly status: 'live' | 'ended';
  readonly endReason?: VoiceEndReason;
  readonly durationSec?: number;
  readonly items: readonly ChatVoiceItem[];
}

export type CallAction =
  | { type: 'callStart'; id: string }
  | { type: 'callLine'; id: string; line: Omit<ChatVoiceLine, 'kind'> }
  /** The visitor interrupted: agent line `lineId` is cut to what was actually spoken. */
  | { type: 'callCorrection'; id: string; lineId: string; text: string }
  | { type: 'callAction'; id: string; action: ChatActionCall }
  | { type: 'callActionPatch'; id: string; callId: string; patch: Partial<ChatActionCall> }
  | { type: 'callEnd'; id: string; reason: VoiceEndReason; durationSec: number };

export const startCall = (id: string): ChatVoiceCall => ({
  kind: 'call',
  id,
  status: 'live',
  items: [],
});

/** Pure transitions of one call; an ended call ignores everything after its end. */
export function callReducer(
  call: ChatVoiceCall,
  action: Exclude<CallAction, { type: 'callStart' }>,
): ChatVoiceCall {
  if (call.status === 'ended') return call;
  switch (action.type) {
    case 'callLine': {
      const line: ChatVoiceLine = { kind: 'line', ...action.line };
      const known = call.items.some((item) => item.kind === 'line' && item.id === line.id);
      const items = known
        ? call.items.map((item) => (item.kind === 'line' && item.id === line.id ? line : item))
        : [...call.items, line];
      return { ...call, items };
    }
    case 'callCorrection':
      return {
        ...call,
        items: call.items.map((item) =>
          item.kind === 'line' && item.id === action.lineId ? { ...item, text: action.text } : item,
        ),
      };
    case 'callAction':
      return { ...call, items: [...call.items, { kind: 'action', action: action.action }] };
    case 'callActionPatch':
      return {
        ...call,
        items: call.items.map((item) =>
          item.kind === 'action' && item.action.call.id === action.callId
            ? { kind: 'action', action: { ...item.action, ...action.patch } }
            : item,
        ),
      };
    case 'callEnd':
      return {
        ...call,
        items: call.items.map(settleAction),
        status: 'ended',
        endReason: action.reason,
        durationSec: action.durationSec,
      };
  }
}

/**
 * A tool still running or waiting for a tap when the call ends never reports back: its chip
 * shows the outcome the agent got (a waiting card is declined) instead of running forever.
 */
function settleAction(item: ChatVoiceItem): ChatVoiceItem {
  if (item.kind !== 'action' || item.action.result) return item;
  const error = item.action.status === 'awaiting' ? 'declined' : 'failed';
  return {
    kind: 'action',
    action: { ...item.action, status: 'finished', result: { ok: false, error } },
  };
}
