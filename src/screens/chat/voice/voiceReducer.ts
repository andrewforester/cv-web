import { VOICE_MAX_CALL_SECONDS, type VoiceLineRole } from '../../../data/voice';
import type { ChatActionCall } from '../ChatUiState';
import type {
  VoiceAnnouncement,
  VoiceContactRequest,
  VoiceErrorKind,
  VoicePhase,
  VoiceStatus,
  VoiceUiState,
} from './VoiceUiState';

/**
 * The call's own state; its transcript lives in the chat's conversation, and where it shows is the
 * chat's surface (`chatSurface.ts`).
 */
export interface VoiceModel {
  /** A call attempt runs, or its card shows. */
  readonly open: boolean;
  /** The browser is probably showing its microphone prompt. */
  readonly micHint: boolean;
  readonly live: boolean;
  readonly mode: 'listening' | 'speaking';
  readonly muted: boolean;
  readonly elapsedSec: number;
  readonly maxCallSeconds: number;
  readonly caption: {
    readonly id: string;
    readonly role: VoiceLineRole;
    readonly text: string;
  } | null;
  readonly action: ChatActionCall | null;
  /** A visual page tool ran: its chip holds until the agent's turn ends. */
  readonly toolShown: boolean;
  readonly contact: VoiceContactRequest | null;
  readonly error: VoiceErrorKind | null;
  /**
   * Try again on a card: the card stays (no connecting view, no toggle) until the attempt gets a
   * token or the microphone prompt shows, so a quick second failure doesn't flash the stage.
   */
  readonly retrying: boolean;
}

export type VoiceModelAction =
  | { type: 'open' }
  | { type: 'micPrompt' }
  | { type: 'micGranted' }
  | { type: 'session'; maxCallSeconds: number }
  | { type: 'live' }
  | { type: 'mode'; mode: 'listening' | 'speaking' }
  | { type: 'line'; id: string; role: VoiceLineRole; text: string }
  | { type: 'correction'; id: string; text: string }
  | { type: 'muted'; muted: boolean }
  | { type: 'tick'; elapsedSec: number }
  /** A page tool started or changed; a `visual` one holds its chip until the turn ends. */
  | { type: 'action'; action: ChatActionCall; visual?: boolean }
  /** The chip leaves. */
  | { type: 'actionDone' }
  | { type: 'contact'; contact: VoiceContactRequest | null }
  | { type: 'error'; error: VoiceErrorKind }
  | { type: 'close' };

export const initialVoiceModel: VoiceModel = {
  open: false,
  micHint: false,
  live: false,
  mode: 'listening',
  muted: false,
  elapsedSec: 0,
  maxCallSeconds: VOICE_MAX_CALL_SECONDS,
  caption: null,
  action: null,
  toolShown: false,
  contact: null,
  error: null,
  retrying: false,
};

export function voiceReducer(model: VoiceModel, action: VoiceModelAction): VoiceModel {
  switch (action.type) {
    case 'open':
      return { ...initialVoiceModel, open: true, error: model.error, retrying: !!model.error };
    case 'micPrompt':
      return { ...model, micHint: true, error: null, retrying: false };
    case 'micGranted':
      return { ...model, micHint: false };
    case 'session':
      return { ...model, maxCallSeconds: action.maxCallSeconds, error: null, retrying: false };
    case 'live':
      return { ...model, live: true, elapsedSec: 0 };
    case 'mode':
      return { ...model, mode: action.mode };
    case 'line':
      return { ...model, caption: { id: action.id, role: action.role, text: action.text } };
    case 'correction':
      return model.caption?.id === action.id
        ? { ...model, caption: { ...model.caption, text: action.text } }
        : model;
    case 'muted':
      return { ...model, muted: action.muted };
    case 'tick':
      return { ...model, elapsedSec: action.elapsedSec };
    case 'action':
      return {
        ...model,
        action: action.action,
        toolShown: model.toolShown || action.visual === true,
      };
    case 'actionDone':
      return { ...model, action: null, toolShown: false };
    case 'contact':
      return { ...model, contact: action.contact };
    case 'error':
      return {
        ...model,
        open: true,
        live: false,
        error: action.error,
        retrying: false,
        contact: null,
        action: null,
        toolShown: false,
      };
    case 'close':
      return { ...initialVoiceModel, maxCallSeconds: model.maxCallSeconds };
  }
}

function statusOf(model: VoiceModel): VoiceStatus {
  if (!model.open) return 'idle';
  if (model.error) return 'error';
  return model.live ? 'live' : 'connecting';
}

function phaseOf(model: VoiceModel): VoicePhase {
  if (model.error) return 'error';
  if (model.contact) return 'contact';
  if (model.toolShown) return 'tool';
  if (!model.live) return 'connecting';
  return model.mode;
}

export function toVoiceUiState(
  model: VoiceModel,
  announcement: VoiceAnnouncement | null,
): VoiceUiState {
  const { caption } = model;
  return {
    status: statusOf(model),
    phase: phaseOf(model),
    micHint: model.micHint,
    muted: model.muted,
    elapsedSec: model.elapsedSec,
    maxCallSeconds: model.maxCallSeconds,
    caption: caption && { role: caption.role, text: caption.text },
    action: model.action,
    contact: model.contact,
    error: model.error,
    retrying: model.retrying,
    announcement,
  };
}
