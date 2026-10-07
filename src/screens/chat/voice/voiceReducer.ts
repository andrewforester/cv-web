import { VOICE_MAX_CALL_SECONDS, type VoiceLineRole } from '../../../data/voice';
import type { ChatActionCall } from '../ChatUiState';
import type {
  VoiceAnnouncement,
  VoiceContactRequest,
  VoiceErrorKind,
  VoicePhase,
  VoiceUiState,
} from './VoiceUiState';

/** The voice mode's own state; the call's transcript lives in the chat's conversation. */
export interface VoiceModel {
  readonly open: boolean;
  readonly permission: 'pending' | 'granted';
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
  /** A visual page tool ran: the fog is parted until the agent's turn ends. */
  readonly fogParted: boolean;
  readonly contact: VoiceContactRequest | null;
  readonly error: VoiceErrorKind | null;
}

export type VoiceModelAction =
  | { type: 'open' }
  | { type: 'micGranted' }
  | { type: 'session'; maxCallSeconds: number }
  | { type: 'live' }
  | { type: 'mode'; mode: 'listening' | 'speaking' }
  | { type: 'line'; id: string; role: VoiceLineRole; text: string }
  | { type: 'correction'; id: string; text: string }
  | { type: 'muted'; muted: boolean }
  | { type: 'tick'; elapsedSec: number }
  /** A page tool started or changed; `visual` tools part the fog. */
  | { type: 'action'; action: ChatActionCall; visual?: boolean }
  /** The fog closes and the chip leaves. */
  | { type: 'actionDone' }
  | { type: 'contact'; contact: VoiceContactRequest | null }
  | { type: 'error'; error: VoiceErrorKind }
  | { type: 'close' };

export const initialVoiceModel: VoiceModel = {
  open: false,
  permission: 'pending',
  live: false,
  mode: 'listening',
  muted: false,
  elapsedSec: 0,
  maxCallSeconds: VOICE_MAX_CALL_SECONDS,
  caption: null,
  action: null,
  fogParted: false,
  contact: null,
  error: null,
};

export function voiceReducer(model: VoiceModel, action: VoiceModelAction): VoiceModel {
  switch (action.type) {
    case 'open':
      return { ...initialVoiceModel, open: true };
    case 'micGranted':
      return { ...model, permission: 'granted' };
    case 'session':
      return { ...model, maxCallSeconds: action.maxCallSeconds };
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
        fogParted: model.fogParted || action.visual === true,
      };
    case 'actionDone':
      return { ...model, action: null, fogParted: false };
    case 'contact':
      return { ...model, contact: action.contact };
    case 'error':
      return {
        ...model,
        open: true,
        live: false,
        error: action.error,
        contact: null,
        action: null,
        fogParted: false,
      };
    case 'close':
      return { ...initialVoiceModel, maxCallSeconds: model.maxCallSeconds };
  }
}

function phaseOf(model: VoiceModel): VoicePhase {
  if (model.error) return 'error';
  if (model.contact) return 'contact';
  if (model.fogParted) return 'tool';
  if (!model.live) return 'connecting';
  return model.mode;
}

export function toVoiceUiState(
  model: VoiceModel,
  announcement: VoiceAnnouncement | null,
): VoiceUiState {
  const { caption } = model;
  return {
    open: model.open,
    phase: phaseOf(model),
    permission: model.permission,
    muted: model.muted,
    live: model.live,
    elapsedSec: model.elapsedSec,
    maxCallSeconds: model.maxCallSeconds,
    caption: caption && { role: caption.role, text: caption.text },
    action: model.action,
    contact: model.contact,
    error: model.error,
    announcement,
  };
}
