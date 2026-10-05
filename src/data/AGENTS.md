# data

Why it exists: everything the site knows about Andrew's CV and where it comes from. The CV is
content, not UI text: the one page v3 (`docs/design/v3/`, ADR-0006) is `CvPage` (`cvPage.ts`,
English only: meta bar, header with stats and contacts, craft cards, the loop, impact, jobs with
Transcenda's projects, skills, education, about, footer CTA) behind `CvPageRepository.getCvPage()`.

Place in the architecture: the bottom layer. Screens reach it only through their state holders,
via the repository interface provided in `src/app/AppProviders.tsx`. The repository is async on
purpose so the planned CV-editing backend can replace today's bundled JSON (`mock/`) by adding an
HTTP implementation and swapping one binding. `chat/` is the data layer of the AI chat and owns
the `/api/chat` contract shared with `server/`; `retro/` is the show's scenario data and `v: 3`
contract.

Domain rules:
- Images are references (a bundled asset id resolved by the screen, or a URL); text is plain
  strings, never HTML.
- Every list item carries a stable slug `id`: React key and the AI page agent's target
  (`chat/agentTools.ts` → `cvPageTargetIds`).
- `cvPage.ts` may be imported by the server, so it stays framework-free.
- Only emphasis (`accent`) is data; card tones and section headings belong to the screen.
