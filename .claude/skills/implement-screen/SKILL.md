---
name: implement-screen
description: Implement a new CV Andrew Panasiuk screen or page (from a design package, screenshot or description) following project conventions, with tests and visual verification. Use whenever the task is to add or rebuild a screen or a reusable UI component.
---

# Implement a screen

1. **Gather the design.** If the brief points to `docs/design/<screen>/`, work only from `SPEC.md`, `screenshot.png` and `assets/` there and do **not** call design-tool MCPs (they are rationed). Otherwise, with only an image: study it carefully (spacing, type scale, colours, states), but take the style from the style reference and the theme (`docs/COORDINATION.md` → Design source of truth). Write down the component tree before coding.
2. **Tokens first.** Any new colour / text style / radius / spacing goes into the theme (`docs/COORDINATION.md` → Scaffold decisions says where). Reuse existing tokens where values match within ~2px / near-identical colour.
3. **Assets.** Icons as single-colour vectors tinted in code; images and strings in the screen's own files with the `<screen>` prefix/namespace (see `docs/COORDINATION.md` → Hot spots).
4. **Components.** Reusable pieces go to shared components. Screen-specific pieces stay in the screen folder.
5. **Architecture.** Follow `CLAUDE.md` → Architecture & code quality: data (models + repository/API interface + mock) → UI state → stateless components. One component per file; split files past ≈200–250 lines. Reuse before you write: check shared components and other screens; a piece another screen already has is moved to shared components (ask in a comment if that's outside your zone), never copied.
6. **Screen.** A stateless screen component taking UI state + callbacks, with stable test ids for its key elements. Mock data from the data layer.
7. **Test.** Add a UI test for the screen that checks key content is displayed and the main interaction works.
8. **Verify.** *format*, *lint*, *test* (`CLAUDE.md` → Commands). Then the *web check*: build, serve, screenshot with Playwright at the target viewport and compare side by side with the design. Fail the check on any `pageerror`: a green build can still crash at startup. Fix visible differences before pushing.
9. **Package docs.** Write or update `agents.md` in each folder you touched: business purpose, what the user sees, main types and how they fit together, data source, stubs. Short (≈40 lines max), for the next agent.
10. **Push and mark the draft PR ready** (the orchestrator opened it; see `.claude/skills/develop` → Finish). CI skips drafts. Put the local screenshot from step 8 where `docs/COORDINATION.md` → Tracker → Screenshots says and link it in your report, never on the feature branch.
