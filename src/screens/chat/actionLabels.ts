import type { AgentToolCall } from '../../data/chat';
import type { Cv } from '../../data/models';
import type { ChatConfirmation } from './ChatUiState';
import { splitTargetId } from './actionText';
import type { ChatStrings } from './strings';

/** The CV's own name for a highlight target (technology, job, app, book); other targets: none. */
export function cvItemLabel(call: AgentToolCall, cv: Cv | null): string | undefined {
  if (call.name !== 'highlightElement' || !cv) return undefined;
  const [kind, id] = splitTargetId(String(call.input.target));
  const byId = <T extends { id: string }>(items: T[]) => items.find((item) => item.id === id);
  switch (kind) {
    case 'technology':
      return byId(cv.technologies)?.title;
    case 'experience':
      return byId([...cv.latestExperience, ...cv.previousExperience])?.company;
    case 'app':
      return byId(cv.apps)?.name;
    case 'book':
      return byId(cv.books)?.title;
    default:
      return undefined;
  }
}

const withoutScheme = (url: string) => url.replace(/^https?:\/\//, '');

/**
 * The confirmation card text for a confirm tool, from the CV data (never from model text).
 * `undefined` when the CV can't back the call, e.g. an unknown channel: the call is not run.
 */
export function buildConfirmation(
  call: AgentToolCall,
  cv: Cv | null,
  strings: ChatStrings,
): ChatConfirmation | undefined {
  if (!cv) return undefined;
  if (call.name !== 'openContact') return { title: strings.confirmGeneric, detail: call.name };
  const { email, phone, whatsappUrl, telegramUrl } = cv.header.contacts;
  switch (call.input.channel) {
    case 'email':
      return { title: strings.confirmEmail, detail: email };
    case 'phone':
      return { title: strings.confirmPhone, detail: phone };
    case 'whatsapp':
      return { title: strings.confirmWhatsapp, detail: withoutScheme(whatsappUrl) };
    case 'telegram':
      return { title: strings.confirmTelegram, detail: withoutScheme(telegramUrl) };
    default:
      return undefined;
  }
}
