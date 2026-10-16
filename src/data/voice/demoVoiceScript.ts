import { FakeVoiceClient, type FakeVoiceStep } from './FakeVoiceClient';

const line = (id: string, role: 'visitor' | 'agent', text: string): FakeVoiceStep => ({
  event: { type: 'line', line: { id, role, text } },
});
const speaking: FakeVoiceStep = { event: { type: 'mode', mode: 'speaking' } };
const listening: FakeVoiceStep = { event: { type: 'mode', mode: 'listening' } };

/** The demo call's start: live, then the agent's greeting. */
export const DEMO_VOICE_INTRO: readonly FakeVoiceStep[] = [
  { event: { type: 'status', status: 'live' } },
  speaking,
  line(
    'demo-agent-0',
    'agent',
    'Hi, I’m the voice assistant on Andrew’s CV. This is a demo call: nothing you say is heard.',
  ),
  listening,
];

/**
 * One round of the demo call, repeated until the visitor ends it: three questions, each answered
 * with a page tool (scroll or highlight), and one answer the visitor interrupts (a correction).
 */
export const DEMO_VOICE_LOOP: readonly FakeVoiceStep[] = [
  line('demo-visitor-1', 'visitor', 'Where does he work now?'),
  speaking,
  { tool: { name: 'scrollToSection', input: { section: 'experience' } } },
  line('demo-agent-1', 'agent', 'Here is his experience, the most recent job first.'),
  listening,
  line('demo-visitor-2', 'visitor', 'Show me his impact.'),
  speaking,
  { tool: { name: 'scrollToSection', input: { section: 'impact' } } },
  line(
    'demo-agent-2',
    'agent',
    'This is his selected impact. Let me walk you through each card, starting with the first one.',
  ),
  listening,
  { event: { type: 'correction', id: 'demo-agent-2', text: 'This is his selected impact.' } },
  line('demo-visitor-3', 'visitor', 'And his skills?'),
  speaking,
  { tool: { name: 'highlightElement', input: { target: 'section:skills' } } },
  line('demo-agent-3', 'agent', 'I’ve highlighted his skills: Android, iOS and AI tooling.'),
  listening,
];

/** The demo agent's spoken answer to any typed line: nothing is read, as nothing is heard. */
export const DEMO_TYPED_ANSWER =
  'I got your typed line. This is a demo call, so I don’t read it, but a real call answers it out loud.';

/** Delay between demo steps: a page tool every ~6 s. */
const DEMO_STEP_MS = 1200;

/**
 * The `?voice=demo` client of `npm run demo`: a call that never hangs up by itself, so every panel
 * state (mute, Show chat, collapse, the time warning and cap, End, typing mid-call) can be tried.
 * No network, no microphone, no audio.
 */
export function createDemoVoiceClient(): FakeVoiceClient {
  return new FakeVoiceClient({
    script: DEMO_VOICE_INTRO,
    loop: DEMO_VOICE_LOOP,
    stepMs: DEMO_STEP_MS,
    answerTyped: () => DEMO_TYPED_ANSWER,
  });
}
