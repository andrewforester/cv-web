# home/motion

Why it exists: the CV page should feel alive on first look without hiding anything (design
`docs/design/motion/`, its **Orchestrator decisions** first). On load the header plays an intro
(meta bar, photo, name, headline with a drifting gradient word, summary, stat tiles whose values
count up, contact buttons); while scrolling a thin brand bar on top shows how far down the visitor
is and the header's stat tiles drift up slightly. Every section below plays its own entrance once,
the first time it scrolls in (headings, cards, the loop panel with its highlight run and typewriter
line, impact figures counting up, the experience tree growing, the closing call to action); with a
mouse, cards tilt towards the cursor and a spotlight follows it over the loop panel. The "Ask my
AI" launcher's entry and two pulses belong to the chat screen (`src/screens/chat/useLauncherIntro.ts`).

Place in the architecture: a presentation side effect of the stateless `HomeScreen`, no UI state.
It works on the DOM with the Web Animations API, IntersectionObserver and rAF (no libraries), finds
the parts by their `data-motion` names (not the test ids, which are the Show case's contract) and
takes easings, durations and colours from the theme's motion tokens at runtime; the choreography
(delays, offsets) is here, as in the SPEC's tables. One run owns everything it starts and undoes it
on stop: animations cancelled, counted text restored, listeners and observers removed.

Domain terms:
- **Gate**: motion runs only with the Web Animations API, without `prefers-reduced-motion: reduce`,
  outside print and outside the Show case (`[data-retro-stage]` on the shell). It stops before
  printing, when reduced motion is switched on and when the show takes the page.
- **Hidden start states** come only from the animations' backward fill, applied before the first
  paint: no static CSS hides anything, so without motion every part is visible at rest.
- **Reveal once**: a part waits at its first keyframe (from before the first paint) until its
  trigger (its block) scrolls in, plays once, then **settles**: its effect is removed, and only
  then may hover tilt it. A trigger already scrolled past when first checked is shown at once.
- **Show now**: when the page agent highlights an item, every reveal still waiting in or around it
  ends at once, so the highlight never outlines an empty space.
- The handoff's "Education / certificates" row is the page's education + about-me cards row; its
  "badges" are the book covers.

Stubs and limits: only the `Full` level (no `Subtle`, no switch, no `TnAir` theme). Tilt and the
spotlight need a hovering fine pointer. A plain agent scroll (no highlight) lands while the target
plays its entrance. The e2e and the web check run with reduced motion, so the motion is covered by
unit tests here and in the launcher's.
`motionTestHarness.ts` is the tests' fake Web Animations API, tokens and `matchMedia`.
