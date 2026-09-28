# data

The CV data layer: what the site shows and where it comes from. UI never imports from here
directly except through a screen's state holder (`useCvRepository()` inside `use<Screen>State`).

- `models.ts`: `Cv` (name, title for now), already localized. Each CV section Issue extends it.
- `CvRepository.ts`: the seam. `getCv(locale): Promise<Cv>`, async so an HTTP backend fits.
- `CvRepositoryContext.ts`: React context + `useCvRepository()` hook.
- `mock/`: `StaticCvRepository` over `cv.en.json` / `cv.uk.json` (placeholder name/title).

Binding: `src/app/AppProviders.tsx` creates the repository. A backend (planned, to edit the CV)
adds e.g. `http/HttpCvRepository.ts` and swaps that one line. Tests pass a fake repository into
`CvRepositoryContext`.

Stubs: real CV content is not here yet (out of scope of the Scaffold Issue).
