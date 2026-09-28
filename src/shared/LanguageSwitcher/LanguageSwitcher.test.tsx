import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { languageSwitcherTestIds } from './testIds';

describe('LanguageSwitcher', () => {
  it('marks the current locale and reports the chosen one', async () => {
    const onChange = vi.fn();
    render(
      <I18nProvider initial="en">
        <LanguageSwitcher locale="en" onChange={onChange} />
      </I18nProvider>,
    );

    expect(screen.getByTestId(languageSwitcherTestIds.option('en'))).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByTestId(languageSwitcherTestIds.option('uk')));
    expect(onChange).toHaveBeenCalledWith('uk');
  });
});
