import type { CvContact } from '../../data';
import type { AgentToolCall, CvContactChannel } from '../../data/chat';
import type { ChatConfirmation } from './ChatUiState';
import { splitTargetId } from './actionText';
import type { ChatPageContent } from './pageContent';
import type { ChatStrings } from './strings';

const byId = <T extends { id: string }>(items: T[], id: string) =>
  items.find((item) => item.id === id);

function pageItemLabel(kind: string, id: string, page: ChatPageContent): string | undefined {
  switch (kind) {
    case 'impact':
      return byId(page.impact, id)?.value;
    case 'experience':
      return byId(page.jobs, id)?.company;
    case 'app':
      return byId(
        page.jobs.flatMap((job) => job.projects ?? []),
        id,
      )?.name;
    case 'skill':
      return byId(page.skills, id)?.title;
    case 'book':
      return byId(page.about.books, id)?.title;
    default:
      return undefined;
  }
}

/** The page's own name for a highlighted item ("1M+", "Transcenda"); other targets: none. */
export function itemLabel(
  call: AgentToolCall,
  content: ChatPageContent | null,
): string | undefined {
  if (call.name !== 'highlightElement' || !content) return undefined;
  const [kind, id] = splitTargetId(String(call.input.target));
  return pageItemLabel(kind, id, content);
}

const CONFIRM_KEYS: Record<CvContactChannel, keyof ChatStrings> = {
  email: 'confirmEmail',
  whatsapp: 'confirmWhatsapp',
  linkedin: 'confirmLinkedin',
};

/** Where the contact leads: the address for email, the link without its scheme otherwise. */
const contactDetail = ({ href, label }: CvContact) =>
  /^https?:\/\//.test(href) ? href.replace(/^https?:\/\//, '').replace(/\/$/, '') : label;

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
  const channel = String(call.input.channel);
  const key = (CONFIRM_KEYS as Partial<Record<string, keyof ChatStrings>>)[channel];
  const contact = byId(content.contacts, channel);
  return key && contact ? { title: strings[key], detail: contactDetail(contact) } : undefined;
}
