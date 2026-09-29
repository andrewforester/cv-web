import type { AgentContactChannel, AgentSectionId, AgentToolCall } from '../../data/chat';
import type { ChatActionCall } from './ChatUiState';
import type { ChatStrings } from './strings';

type Key = keyof ChatStrings;

const SECTION_KEYS: Record<AgentSectionId, Key> = {
  header: 'sectionHeader',
  summary: 'sectionSummary',
  technologies: 'sectionTechnologies',
  'latest-experience': 'sectionLatestExperience',
  apps: 'sectionApps',
  education: 'sectionEducation',
  about: 'sectionAbout',
  'previous-experience': 'sectionPreviousExperience',
};

const CHANNEL_KEYS: Record<AgentContactChannel, Key> = {
  email: 'channelEmail',
  phone: 'channelPhone',
  whatsapp: 'channelWhatsapp',
  telegram: 'channelTelegram',
};

const LANGUAGE_KEYS: Record<string, Key> = { en: 'languageEn', uk: 'languageUk' };

const lookup = (table: Partial<Record<string, Key>>, id: string, strings: ChatStrings) => {
  const key = table[id];
  return key ? strings[key] : undefined;
};

/** The `<kind>` and `<id>` of a `highlightElement` target such as `technology:kotlin`. */
export function splitTargetId(target: string): [kind: string, id: string] {
  const colon = target.indexOf(':');
  return colon === -1 ? ['', target] : [target.slice(0, colon), target.slice(colon + 1)];
}

/** The visitor-facing name of what a call acts on; CV item titles come from `action.label`. */
export function actionTarget(action: ChatActionCall, strings: ChatStrings): string {
  const { name, input } = action.call;
  const value = (param: string) => (typeof input[param] === 'string' ? input[param] : '');
  switch (name) {
    case 'scrollToSection':
      return lookup(SECTION_KEYS, value('section'), strings) ?? value('section');
    case 'switchLanguage':
      return lookup(LANGUAGE_KEYS, value('locale'), strings) ?? value('locale');
    case 'openContact':
      return lookup(CHANNEL_KEYS, value('channel'), strings) ?? value('channel');
    case 'highlightElement': {
      const [kind, id] = splitTargetId(value('target'));
      const fixed = kind === 'section' ? SECTION_KEYS : kind === 'contact' ? CHANNEL_KEYS : {};
      return lookup(fixed, id, strings) ?? action.label ?? id;
    }
  }
}

const PHRASES: Record<AgentToolCall['name'], [running: Key, done: Key]> = {
  scrollToSection: ['actionScrollRunning', 'actionScrollDone'],
  highlightElement: ['actionHighlightRunning', 'actionHighlightDone'],
  switchLanguage: ['actionLanguageRunning', 'actionLanguageDone'],
  openContact: ['actionContactRunning', 'actionContactDone'],
};

const fill = (template: string, target: string) => template.replace('{target}', target);

/** The chip's (and the live region's) text for the action's current state. */
export function actionText(action: ChatActionCall, strings: ChatStrings): string {
  const phrases = (PHRASES as Partial<Record<string, [Key, Key]>>)[action.call.name];
  const target = actionTarget(action, strings);
  const { result } = action;
  if (action.status === 'awaiting') return action.confirmation?.title ?? strings.confirmGeneric;
  if (!result) return phrases ? fill(strings[phrases[0]], target) : strings.actionGenericRunning;
  if (result.ok) return phrases ? fill(strings[phrases[1]], target) : strings.actionGenericDone;
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
