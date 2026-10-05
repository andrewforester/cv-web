import { defineStrings } from '../../i18n';

/**
 * `chat` namespace, English only: docs/design/chat/SPEC.md → Texts, with the orchestrator decisions
 * O1–O4; the first questions, commands and section names of ADR-0006 → Decision 3.
 */
export const chatStrings = defineStrings({
  en: {
    fabLabel: 'Open chat with the AI assistant',
    hint: 'Questions about Andrew’s experience? Ask the AI assistant.',
    hintDismiss: 'Dismiss',
    title: 'Ask about Andrew',
    subtitle: 'AI assistant · answers from this page',
    close: 'Close chat',
    listLabel: 'Conversation',
    you: 'You:',
    assistant: 'Assistant:',
    greeting:
      'Hi! I’m an AI assistant. Ask me about Andrew’s experience, skills and projects — I answer from this page.',
    tryAsking: 'Try asking',
    suggestion1: 'How does he build with AI agents?',
    suggestion2: 'What impact has he had?',
    suggestion3: 'Which apps has he shipped?',
    suggestion4: 'Is he open to new roles?',
    inputLabel: 'Your question',
    placeholder: 'Ask a question…',
    send: 'Send',
    stop: 'Stop answer',
    disclaimer: 'Answers are AI-generated and may contain mistakes.',
    typing: 'Assistant is typing…',
    stopped: 'Answer stopped.',
    error: 'Sorry, I couldn’t answer. Please try again.',
    retry: 'Try again',
    rateLimited: 'I’m getting a lot of questions right now. Please try again in a minute.',
    unavailable: 'The assistant is unavailable right now. Please try again later.',
    unsupportedVersion: 'The chat has been updated. Please reload the page.',
    errorGeneric: 'Something went wrong. Please try again later.',
    refusal: 'I can’t help with that. Try asking about Andrew’s experience.',
    offline: 'You’re offline. Connect to the internet to ask a question.',
    tooLong: 'Shorten your question to {max} characters or fewer.',
    counter: '{count} / {max}',
    conversationLimit: 'This chat has reached its length limit. Start a new chat to ask more.',
    newChat: 'Start a new chat',
    commandsLabel: 'Or ask me to do something on the page',
    command1: 'Show his selected impact',
    command2: 'Highlight his work at Transcenda',
    command3: 'Scroll to his contacts',
    actionScrollRunning: 'Scrolling to {target}…',
    actionScrollDone: 'Scrolled to {target}',
    actionHighlightRunning: 'Showing {target}…',
    actionHighlightDone: 'Showing {target}',
    actionContactRunning: 'Opening {target}…',
    actionContactDone: 'Opened {target}',
    actionGenericRunning: 'Working on the page…',
    actionGenericDone: 'Done',
    actionDeclined: 'Cancelled',
    actionUnavailable: 'That isn’t available on this page.',
    actionFailed: 'The action didn’t work.',
    confirmEmail: 'Write an email to Andrew?',
    confirmWhatsapp: 'Open a WhatsApp chat with Andrew?',
    confirmTelegram: 'Open a Telegram chat with Andrew?',
    confirmLinkedin: 'Open Andrew’s LinkedIn profile?',
    confirmGeneric: 'Run this action on the page?',
    confirm: 'Confirm',
    cancel: 'Cancel',
    sectionHeader: 'Top of the page',
    sectionCraft: 'Code craft',
    sectionLoop: 'How I build with agents',
    sectionImpact: 'Selected impact',
    sectionExperience: 'Experience',
    sectionSkills: 'Skills',
    sectionEducation: 'Education',
    sectionAbout: 'About me',
    sectionContacts: 'Contacts',
    channelEmail: 'Email',
    channelWhatsapp: 'WhatsApp',
    channelTelegram: 'Telegram',
    channelLinkedin: 'LinkedIn',
  },
});

export type ChatStrings = { [K in keyof typeof chatStrings.en]: string };

/** Fills `{name}` placeholders of a string. */
export function formatString(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
