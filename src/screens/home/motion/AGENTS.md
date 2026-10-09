# home/motion

Why it exists: the CV page should feel alive on first look without hiding anything (design
`docs/design/motion/`, its **Orchestrator decisions** first). On load the header plays an intro
(meta bar, photo, name, headline with a drifting gradient word, summary, stat tiles whose values
count up, contact buttons); while scrolling a thin brand bar on top shows how far down the visitor
is and the header's stat tiles drift up slightly. The "Ask my AI" launcher's entry and two pulses
belong to the chat screen (`src/screens/chat/useLauncherIntro.ts`).

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
- **Reveal once**: the kit's on-scroll trigger for the sections below the header (Motion 2).

Stubs and limits: only the `Full` level (no `Subtle`, no switch). Section reveals, 3D tilt, the
loop panel's spotlight and the closing call to action's motion are Motion 2. The e2e and the web
check run with reduced motion, so the motion is covered by unit tests here and in the launcher's.
`motionTestHarness.ts` is the tests' fake Web Animations API, tokens and `matchMedia`.
