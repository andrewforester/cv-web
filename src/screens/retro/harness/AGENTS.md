# retro/harness

Why it exists: to see and screenshot the show before the shell (R5) mounts it: the real page
(`CvRoute`, or the page of `?scenario=<id>`) on a stage like the shell's, the show over it, the
scripted `FakeShowRepository`.
Dev only: not a Vite build entry, never shipped. `npm run dev`, then open
`/src/screens/retro/harness/index.html`; Playwright's `page.clock` can fast-forward it.
The AI chat loader is a stub (a screen can't import another screen); the shell passes the real one.
`RetroShowTestHarness.test.tsx` opens `?scenario=<id>` for every registered scenario, so a new
scenario cannot land without its harness page working.
