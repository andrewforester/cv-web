# forest

Why it exists: the "Forest" look (`docs/design/forest/`) is shared by both CV pages, `/new`
(the profile screen) and `/` (the CV screen). Its building blocks live here once,
so the two pages look the same and a style fix lands everywhere.

What it holds: a page column (`ForestPage`, `PageStatus` for loading / error), the top
(`PageHeader`, `MetaBar` with an `end` slot for the language
switcher and page actions, `ShowCaseButton` (the meta bar's text control that starts the Retro
Rebuild show; the app shell puts it in the `end` slot of a page that has a show), `Hero`, `LeadRow`, `ContactRows`), numbered sections (`Section`,
`SectionLabel`: `01 — …`), and the section bodies: `ImpactCards`, `LoopPanel` (the dark "How I
build" panel), `JobRow`, `EarlierRow`, `AppPills`, `SkillsGrid`, `InfoCard(s)` (sage / sand cards
for education and about me), `BookCovers`, `FooterCta`, `GradientText`.

Place in the architecture: stateless components below the screens. They know no data model:
plain props in (strings, `ReactNode` where a page needs rich text, image URLs already resolved),
callbacks out (only the Show case button's click today). Blocks and list items take optional `data-*` `attributes`, which the
both pages use for their page-agent targets (`data-agent-id`); the components don't interpret them. Screens map their data (`Profile`, `Cv`) onto them, own the section
order and numbering, the strings and the images. Styles use only `--forest-*` tokens and the
spacing scale from `src/theme/tokens.css`. Item test ids are in `testIds.ts`; screens give the
sections theirs.
