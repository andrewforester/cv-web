import type { AgentToolCall } from '../../data/chat';
import type { Cv, Profile } from '../../data';
import type { ChatConfirmation } from './ChatUiState';
import { splitTargetId } from './actionText';
import type { ChatPageContent } from './pageContent';
import type { ChatStrings } from './strings';

const byId = <T extends { id: string }>(items: T[], id: string) =>
  items.find((item) => item.id === id);

function cvItemLabel(kind: string, id: string, cv: Cv): string | undefined {
  switch (kind) {
    case 'technology':
      return byId(cv.technologies, id)?.title;
    case 'experience':
      return byId([...cv.latestExperience, ...cv.previousExperience], id)?.company;
    case 'app':
      return byId(cv.apps, id)?.name;
    case 'book':
      return byId(cv.books, id)?.title;
    default:
      return undefined;
  }
}

function profileItemLabel(kind: string, id: string, profile: Profile): string | undefined {
  switch (kind) {
    case 'impact':
      return byId(profile.impact, id)?.value;
    case 'experience':
      return byId([...profile.jobs, ...profile.earlier], id)?.company;
    case 'app':
      return byId(profile.apps, id)?.name;
    case 'skill':
      return byId(profile.skills, id)?.title;
    case 'book':
      return byId(profile.about.books, id)?.title;
    default:
      return undefined;
  }
}

/** The page's own name for a highlighted item ("Kotlin", "Transcenda"); other targets: none. */
export function itemLabel(
  call: AgentToolCall,
  content: ChatPageContent | null,
): string | undefined {
  if (call.name !== 'highlightElement' || !content) return undefined;
  const [kind, id] = splitTargetId(String(call.input.target));
  return content.page === 'cv'
    ? cvItemLabel(kind, id, content.cv)
    : profileItemLabel(kind, id, content.profile);
}

const withoutScheme = (url: string) => url.replace(/^https?:\/\//, '');

function cvContact(channel: unknown, cv: Cv, strings: ChatStrings): ChatConfirmation | undefined {
  const { email, phone, whatsappUrl, telegramUrl } = cv.header.contacts;
  switch (channel) {
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

function profileContact(
  channel: unknown,
  profile: Profile,
  strings: ChatStrings,
): ChatConfirmation | undefined {
  const titles: Partial<Record<string, string>> = {
    email: strings.confirmEmail,
    phone: strings.confirmPhone,
  };
  const title = typeof channel === 'string' ? titles[channel] : undefined;
  const contact = title && byId(profile.contacts, String(channel));
  return contact ? { title, detail: contact.label } : undefined;
}

/**
 * The confirmation card text for a confirm tool, from the page's data (never from model text).
 * `undefined` when the data can't back the call, e.g. an unknown channel: the call is not run.
 */
export function buildConfirmation(
  call: AgentToolCall,
  content: ChatPageContent | null,
  strings: ChatStrings,
): ChatConfirmation | undefined {
  if (!content) return undefined;
  if (call.name !== 'openContact') return { title: strings.confirmGeneric, detail: call.name };
  return content.page === 'cv'
    ? cvContact(call.input.channel, content.cv, strings)
    : profileContact(call.input.channel, content.profile, strings);
}
