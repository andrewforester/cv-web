import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProviders } from '../../app/AppProviders';
import { StaticCvRepository } from '../../data';
import { CvRoute } from './CvRoute';
import { cvTestIds } from './testIds';

function stubViewport(desktop: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: desktop && query.includes('min-width: 1024px'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function renderCv(locale: 'en' | 'uk', onShowCase = vi.fn()) {
  render(
    <AppProviders repository={new StaticCvRepository()} locale={locale}>
      <CvRoute metaBarEnd={<span>switcher</span>} onShowCase={onShowCase} />
    </AppProviders>,
  );
  return onShowCase;
}

describe('Show case button', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is in the meta bar for English on a desktop viewport and starts the show', async () => {
    stubViewport(true);
    const onShowCase = renderCv('en');

    await userEvent.click(screen.getByTestId(cvTestIds.showCase));

    expect(screen.getByRole('button', { name: /Show case/ })).toBeVisible();
    expect(onShowCase).toHaveBeenCalledOnce();
  });

  it('is hidden for Ukrainian', () => {
    stubViewport(true);
    renderCv('uk');

    expect(screen.queryByTestId(cvTestIds.showCase)).not.toBeInTheDocument();
  });

  it('is hidden below 1024 px', () => {
    stubViewport(false);
    renderCv('en');

    expect(screen.queryByTestId(cvTestIds.showCase)).not.toBeInTheDocument();
  });
});
