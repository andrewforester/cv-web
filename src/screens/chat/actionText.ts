import type { AgentToolName, CvContactChannel, CvSectionId } from '../../data/chat';
import type { ChatActionCall } from './ChatUiState';
import type { ChatStrings } from './strings';

type Key = keyof ChatStrings;

/** The page's section names (ADR-0006 → Decision 3). */
const SECTION_KEYS: Record<CvSectionId, Key> = {
  header: 'sectionHeader',
  craft: 'sectionCraft',
  loop: 'sectionLoop',
  impact: 'sectionImpact',
  experience: 'sectionExperience',
  skills: 'sectionSkills',
  education: 'sectionEducation',
  about: 'sectionAbout',
  contacts: 'sectionContacts',
};

const CHANNEL_KEYS: Record<CvContactChannel, Key> = {
  email: 'channelEmail',
  whatsapp: 'channelWhatsapp',
  telegram: 'channelTelegram',
  linkedin: 'channelLinkedin',
};

const lookup = (table: Partial<Record<string, Key>>, id: string, strings: ChatStrings) => {
  const key = table[id];
  return key ? strings[key] : undefined;
};

/** The `<kind>` and `<id>` of a `highlightElement` target such as `experience:transcenda`. */
export function splitTargetId(target: string): [kind: string, id: string] {
  const colon = target.indexOf(':');
  return colon === -1 ? ['', target] : [target.slice(0, colon), target.slice(colon + 1)];
}

/** The visitor-facing name of what a call acts on; the page's item names come from `action.label`. */
export function actionTarget(action: ChatActionCall, strings: ChatStrings): string {
  const { name, input } = action.call;
  const value = (param: string) => (typeof input[param] === 'string' ? input[param] : '');
  switch (name) {
    case 'scrollToSection':
      return lookup(SECTION_KEYS, value('section'), strings) ?? value('section');
    case 'openContact':
      return lookup(CHANNEL_KEYS, value('channel'), strings) ?? value('channel');
    case 'highlightElement': {
      const [kind, id] = splitTargetId(value('target'));
      const fixed = kind === 'section' ? SECTION_KEYS : kind === 'contact' ? CHANNEL_KEYS : {};
      return lookup(fixed, id, strings) ?? action.label ?? id;
    }
  }
}

const PHRASES: Record<AgentToolName, [running: Key, done: Key]> = {
  scrollToSection: ['actionScrollRunning', 'actionScrollDone'],
  highlightElement: ['actionHighlightRunning', 'actionHighlightDone'],
  openContact: ['actionContactRunning', 'actionContactDone'],
};

const fill = (template: string, target: string) => template.replace('{target}', target);

/** The chip's (and the live region's) text for the action's current state. */
export function actionText(action: ChatActionCall, strings: ChatStrings): string {
  const phrases = PHRASES[action.call.name];
  const target = actionTarget(action, strings);
  const { result } = action;
  if (action.status === 'awaiting') return action.confirmation?.title ?? strings.confirmGeneric;
  if (!result) return fill(strings[phrases[0]], target);
  if (result.ok) return fill(strings[phrases[1]], target);
  switch (result.error) {
    case 'declined':
      return strings.actionDeclined;
    case 'not_available':
    case 'unknown_target':
      return strings.actionUnavailable;
    default:
      return strings.actionFailed;
  }
}
