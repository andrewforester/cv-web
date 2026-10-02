import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '../../../app/AppProviders';
import { FakeShowRepository, ShowRepositoryContext } from '../../../data/retro';
import '../../../theme/global.css';
import { RetroShowTestHarness } from './RetroShowTestHarness';

// Dev-only harness (not a Vite build entry, never shipped): the show over the real page with the
// scripted repository. `npm run dev`, then /src/screens/retro/harness/index.html
// (`?scenario=<id>` for another page's show).
const root = document.getElementById('root');
if (!root) throw new Error('#root element is missing');
createRoot(root).render(
  <StrictMode>
    <AppProviders locale="en">
      <ShowRepositoryContext value={new FakeShowRepository()}>
        <RetroShowTestHarness />
      </ShowRepositoryContext>
    </AppProviders>
  </StrictMode>,
);
