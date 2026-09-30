import { defineStrings } from '../../i18n';

/**
 * `retro` namespace: docs/design/retro/SPEC.md → Texts, verbatim. EN only by decision (the show
 * runs only in English); `uk` falls back to English. Step titles and narration are scenario data.
 */
export const retroStrings = defineStrings({
  en: {
    pageTitle: 'Andrew Panasiuk - Homepage',
    dockLabel: 'Live fix',
    minimise: 'Minimise',
    // Terminal chat
    chatTitle: '#andrew-cv - agent chat',
    chatLabel: 'Chat with the agent',
    statusConnected: '● connected',
    statusUsers: '2 users',
    statusLocale: 'EN',
    inputLabel: 'Message the agent',
    placeholder: 'type here, press Enter',
    prompt: 'you>',
    agentNick: '<agent>',
    visitorNick: '<you>',
    systemJoin: '*** Now talking in #andrew-cv',
    systemJoined: '*** agent has joined',
    greeting:
      'Oops... looks like this site got stuck in 2002 and is a bit broken. Tell me what you think while I fix it.',
    handoff: 'Opening my console. Every line I type lands on the page right away.',
    scriptedReply: 'Noted! Back to fixing.',
    limitReached:
      "*** That's all I can take while I'm fixing. The chat button will be there when I'm done.",
    tooLong: '*** Message too long (500 characters max).',
    offline: "*** You're offline. The fixes keep going; the chat comes back when you do.",
    // Live console
    consoleTitle: 'fix.exe - live console',
    consoleLabel: 'Live fix console',
    consolePrompt: '$ agent fix --live andrew-cv',
    consoleEnd: 'all fixes applied. Welcome to 2026.',
    progressStep: 'Step {n} of {total}: {title}',
    progressDone: 'All fixes applied',
    stepDoneAnnouncement: 'Step {n} of {total} done: {title}',
    // Decorations
    navHome: 'Home',
    navResume: 'Resume',
    navApps: 'My Apps',
    navBooks: 'Books',
    navGuestbook: 'Guestbook',
    navLinks: 'Links',
    marquee:
      '*** Welcome to my homepage! *** Senior Android Engineer *** Creating Android apps since 2012 *** Please sign my guestbook! ***',
    noteTitle: 'Oh, snap!',
    noteBody: "Some pictures didn't load. Try pressing F5... or just wait a minute.",
    visitorNumber: 'You are visitor number',
    counter: '004271',
    webringPrev: '<< Prev',
    webringName: 'Android Devs Webring',
    webringNext: 'Next >>',
    lastUpdated: 'Last updated: 14.03.2002 · © 2002 Andrew Panasiuk. All rights reserved.',
  },
});

export type RetroStrings = (typeof retroStrings)['en'];

/** Fills `{name}` placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}
