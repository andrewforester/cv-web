---
name: design
description: Turn a screenshot (or photo/mock) of an app screen into a {{PROJECT_NAME}} design package — docs/design/<screen>/SPEC.md with tokens, measurements, structure, texts and behaviour, plus screenshot.png and assets/ — without calling design-tool MCPs. Use when asked to spec, describe, reverse-engineer or prepare the design of a screen from an image, or when a session is started on an Issue labelled design.
---

# Design from a screenshot

Output: `docs/design/<screen>/` in the same shape as the packages already in `docs/design/` (the first one is your reference for format and depth). A developer session will build the screen **only** from this package, so anything you leave out gets guessed.

**Never call design-tool MCPs** (Figma etc.): they are rationed and only the orchestrator uses them. Your zone is `docs/design/<screen>/**` and nothing else.

## 1. Get the image into the repo
- Find the screenshot:
  - usually the orchestrator has already committed it as `docs/design/<screen>/screenshot.png` on your branch (the Issue says so);
  - a path the human or Issue gives you;
  - an attachment saved under `~/.claude/uploads/`.

  If you can only *see* it in the chat and have no file, ask the human to attach it as a file or commit it, and stop.
- Save it as `docs/design/<screen>/screenshot.png`, keeping the original resolution.
- Record the pixel size and the scale: CSS px (or dp) = image px ÷ (image width ÷ logical width). Take the logical width from `docs/COORDINATION.md` → Scaffold decisions (target viewport) unless the image says otherwise.

## 2. The reference is the style, the screenshot is the content
The style reference (`docs/COORDINATION.md` → Design source of truth) sets sizes, colours, type, radii and spacing. So:
- Take from the screenshot *what* is there: blocks, order, content, texts, icons, illustrations, behaviour.
- Specify *how it looks* in the reference language: read the theme/tokens code and the existing design packages, then give every block the matching treatment (card fill/border/radius/padding/shadow, type styles, spacing grid, text colours).
- Sample screenshot colours (Python/PIL, flat areas only) to identify the *role* of each colour, then map the role to an existing token. A new token is justified only when the reference has no colour for that role; list it in **"New tokens needed"** with a suggested name. The theme owner adds it in a separate `theme` Issue.
- Record notable screenshot-vs-reference differences in one short table, for information only.
- **Stay consistent with screens already built.** Before sizing anything, read the other packages in `docs/design/` and the code of built screens and shared components. The same role gets the same treatment on every screen: page title, section title + subtitle, "View All"-type links, pills, primary/secondary buttons, cards, carousels, navigation. Screenshots often have oversized text and buttons: scale them to the existing type roles and control sizes, don't copy them. Name the reused component/token for each block, and list pieces that should be shared with an existing screen under **"Shared components"** (they get moved to shared components, not copied).

## 3. Measure and describe
Write `SPEC.md` with these sections:
- **Source**: the image, the date, what it shows, and the scale used.
- **Colours**: each colour as a token name, hex value and where it's used. Mark each one as *existing* or *new*.
- **Typography**: each style as its token, size/weight and where it's used. Estimate size from cap height (cap ≈ 0.7 × font size for most sans fonts) and round to whole px.
- **Layout**, top to bottom: every block with size, padding, gap, corner radius, border, shadow and alignment. Round to a 2 px or 4 px grid, and state how sure you are when a value is an estimate ("≈16").
- **Texts**: every visible string, verbatim. These become the screen's strings file.
- **Icons and images**, for each one:
  - which existing icon matches;
  - or a precise description (shape, stroke width, size, colour) for a new vector icon;
  - or, for photos and avatars, a crop saved to `assets/` (PIL crop at full resolution, noting it's a placeholder).
- **States and behaviour**: taps, hover/focus, selection, scrolling, loading/empty/error, and anything implied but not shown.
- **Responsive**: how the layout changes between the target viewports, if the project has more than one.
- **Decisions**: for each question the image doesn't answer, the conservative default you chose. The orchestrator may change them.
- Skip anything the Issue lists as **out of scope**, even if it's in the screenshot.
- **Data**: what should come from mocks / the API (names, numbers, lists).

## 4. Check yourself
- Re-read the screenshot block by block against `SPEC.md`: every visible element must appear once.
- Check the sums: the widths of the items in a row plus the gaps and paddings should equal the viewport width.

## 5. Deliver
- Re-read the Issue and all its comments first: scope may have changed while you worked.
- Commit only `docs/design/<screen>/**`.
- **Comment on the Issue** with the open questions (each with the default you put in Decisions), the new tokens, and anything you're unsure of. Never stop to wait for an answer: nobody is watching.
- Push to the draft PR the orchestrator opened (never open another), add a short summary to its body next to `Closes #N`, and mark it **Ready for review** (`update_pull_request`, `draft: false`) as your last step: that starts CI and signals the orchestrator. Process details stay in the Issue.
- Don't merge; the orchestrator merges and then files the `theme` and `screen` Issues from your package.
