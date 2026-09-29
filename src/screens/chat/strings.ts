import { defineStrings } from '../../i18n';

/** `chat` namespace: docs/design/chat/SPEC.md → Texts, with the orchestrator decisions O1–O4. */
export const chatStrings = defineStrings({
  en: {
    fabLabel: 'Open chat with the AI assistant',
    hint: 'Questions about Andrew’s experience? Ask the AI assistant.',
    hintDismiss: 'Dismiss',
    title: 'Ask about Andrew',
    subtitle: 'AI assistant · answers from this CV',
    close: 'Close chat',
    listLabel: 'Conversation',
    you: 'You:',
    assistant: 'Assistant:',
    greeting:
      'Hi! I’m an AI assistant. Ask me about Andrew’s experience, skills and projects — I answer from his CV.',
    tryAsking: 'Try asking',
    suggestion1: 'What is his experience with Android?',
    suggestion2: 'Which AI tools does he use?',
    suggestion3: 'Which apps has he worked on?',
    suggestion4: 'Has he led a team?',
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
  },
  uk: {
    fabLabel: 'Відкрити чат із ШІ-асистентом',
    hint: 'Маєте питання про досвід Андрія? Запитайте ШІ-асистента.',
    hintDismiss: 'Закрити підказку',
    title: 'Запитайте про Андрія',
    subtitle: 'ШІ-асистент · відповідає за резюме',
    close: 'Закрити чат',
    listLabel: 'Розмова',
    you: 'Ви:',
    assistant: 'Асистент:',
    greeting:
      'Привіт! Я ШІ-асистент. Запитайте мене про досвід, навички та проєкти Андрія — я відповідаю на основі його резюме.',
    tryAsking: 'Спробуйте запитати',
    suggestion1: 'Який у нього досвід з Android?',
    suggestion2: 'Якими ШІ-інструментами він користується?',
    suggestion3: 'Над якими застосунками він працював?',
    suggestion4: 'Чи керував він командою?',
    inputLabel: 'Ваше запитання',
    placeholder: 'Поставте запитання…',
    send: 'Надіслати',
    stop: 'Зупинити відповідь',
    disclaimer: 'Відповіді генерує ШІ, тож можливі помилки.',
    typing: 'Асистент пише…',
    stopped: 'Відповідь зупинено.',
    error: 'Вибачте, не вдалося відповісти. Спробуйте ще раз.',
    retry: 'Спробувати ще раз',
    rateLimited: 'Зараз надходить забагато запитань. Спробуйте ще раз за хвилину.',
    unavailable: 'Асистент зараз недоступний. Спробуйте пізніше.',
    unsupportedVersion: 'Чат оновлено. Перезавантажте сторінку.',
    errorGeneric: 'Щось пішло не так. Спробуйте пізніше.',
    refusal: 'З цим я не можу допомогти. Запитайте про досвід Андрія.',
    offline: 'Немає з’єднання з інтернетом. Підключіться, щоб поставити запитання.',
    tooLong: 'Скоротіть запитання до {max} символів.',
    counter: '{count} / {max}',
    conversationLimit: 'Розмова досягла ліміту довжини. Почніть новий чат, щоб запитати ще.',
    newChat: 'Почати новий чат',
  },
});

export type ChatStrings = { [K in keyof typeof chatStrings.en]: string };

/** Fills `{name}` placeholders of a string. */
export function formatString(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
