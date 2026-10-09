/**
 * Canned answers of the dev fake model (`CHAT_FAKE_LLM=1`, `npm run demo`), in the order the
 * visitor gets them: one per question, cycling. The first stays the one the tests know.
 */
export const DEV_ANSWERS: readonly string[] = [
  'This is a scripted answer from the fake model (CHAT_FAKE_LLM=1). Andrew is a **Senior Android Engineer** with iOS experience.\n\n- Kotlin, Jetpack Compose\n- Cync and August Home apps',
  'Short answer: yes, he has shipped apps used by millions of people.',
  'Here is how he usually works on a mobile team:\n\n1. **Architecture first**: a clear data layer, state holders and stateless UI, so features stay testable.\n2. **Shipping**: small pull requests, CI on every change, staged rollouts.\n3. **Quality**: UI tests for every screen, crash-free sessions watched after each release.\n4. **People**: code review as teaching, onboarding guides for new engineers.\n\nAsk me about any of these, or about a specific project.',
];

/** The page tool round that follows the answers in the cycle (when the page offers tools). */
export const DEV_CYCLE_TOOL = { name: 'scrollToSection', value: 'impact' } as const;
