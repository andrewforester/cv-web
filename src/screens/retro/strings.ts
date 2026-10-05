import { defineStrings } from '../../i18n';

/**
 * `retro` namespace: docs/design/retro/SPEC.md → Texts, verbatim. Step titles and narration are
 * scenario data.
 */
export const retroStrings = defineStrings({
  en: {
    pageTitle: 'Andrew Panasiuk - Homepage',
    dockLabel: 'Live fix',
    // Agent chat (the site's AI chat look)
    chatTitle: 'Agent',
    chatSubtitle: 'Fixing this site live',
    minimise: 'Minimise chat',
    restore: 'Restore chat',
    listLabel: 'Conversation with the agent',
    visitorPrefix: 'You:',
    agentPrefix: 'Agent:',
    inputLabel: 'Message the agent',
    placeholder: 'Message the agent…',
    send: 'Send',
    disclaimer: 'Answers are AI-generated and may contain mistakes.',
    charCounter: '{count} / 500',
    // What the agent says before DevTools opens and after it has collapsed (Round 5, verbatim).
    introLine: "That's how this CV would look like in 2001.",
    fixLine: "Now let's fix it.",
    closingLine: 'All good now.',
    scriptedReply: 'Noted, thank you. Continuing with the update.',
    limitReached:
      "That's the message limit for this session. The site's chat button will be available once the update is complete.",
    tooLong: 'Message too long (500 characters max).',
    offline: "You're offline. The update continues; the chat resumes when the connection is back.",
    // DevTools console
    devtoolsLabel: 'Developer tools: live fix console',
    devtoolsTabElements: 'Elements',
    devtoolsTabConsole: 'Console',
    devtoolsTabSources: 'Sources',
    devtoolsContext: 'top',
    devtoolsFilter: 'Filter',
    devtoolsLevels: 'Default levels',
    consoleLabel: 'Live fix console',
    consoleOpening: 'Agent connected to andrew-cv: {changes} changes in {steps} steps.',
    consoleEnd: 'All fixes applied.',
    stepDoneAnnouncement: 'Step {n} of {total} done: {title}',
    // Decorations (SPEC → 2001 `/new` → Texts; the marquee quotes the v3 page: SPEC → v3 refit)
    navHome: 'Home',
    navResume: 'Resume',
    navImpact: 'Impact',
    navApps: 'My Apps',
    navGuestbook: 'Guestbook',
    navLinks: 'Links',
    marquee:
      '*** Welcome to my homepage! *** Senior Software Product Engineer *** Android since 2012 *** Agentic engineering *** Please sign my guestbook! ***',
    noteTitle: 'Oh, snap!',
    noteBody: "Some pictures didn't load. Try pressing F5... or just wait a minute.",
    visitorNumber: 'You are visitor number',
    counter: '004271',
    webringPrev: '<< Prev',
    webringName: 'AI Builders Webring',
    webringNext: 'Next >>',
    lastUpdated: 'Last updated: 14.03.2002 · © 2002 Andrew Panasiuk. All rights reserved.',
  },
});

export type RetroStrings = (typeof retroStrings)['en'];

/** Fills `{name}` placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}
