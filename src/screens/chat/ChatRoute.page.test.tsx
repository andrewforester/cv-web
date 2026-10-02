import { screen, within } from '@testing-library/react';
import type { ChatPage } from '../../data/chat';
import type { Locale } from '../../i18n';
import { answer, inList, renderOpenChat, toolTurn } from './chatTestHarness';
import { chatTestIds } from './testIds';

/** The first suggested question chip. */
const firstSuggestion = () => screen.getAllByTestId(chatTestIds.suggestion)[0] as HTMLElement;
const texts = (testId: string) => screen.queryAllByTestId(testId).map((chip) => chip.textContent);

describe('chat on each page', () => {
  it.each<[ChatPage, Locale, string[]]>([
    [
      'cv',
      'en',
      [
        'What is his experience with Android?',
        'Which AI tools does he use?',
        'Which apps has he worked on?',
        'Has he led a team?',
      ],
    ],
    [
      'cv',
      'uk',
      [
        'Який у нього досвід з Android?',
        'Якими ШІ-інструментами він користується?',
        'Над якими застосунками він працював?',
        'Чи керував він командою?',
      ],
    ],
    [
      'profile',
      'en',
      [
        'What does he build with AI?',
        'How does he work with coding agents?',
        'What impact has he had?',
        'Which apps has he worked on?',
      ],
    ],
    [
      'profile',
      'uk',
      [
        'Що він створює з ШІ?',
        'Як він працює з агентами для програмування?',
        'Яких результатів він досяг?',
        'Над якими застосунками він працював?',
      ],
    ],
  ])('offers the %s page’s first questions (%s)', async (page, locale, suggestions) => {
    await renderOpenChat(locale, { page });
    expect(texts(chatTestIds.suggestion)).toEqual(suggestions);
  });

  it.each<[ChatPage, Locale, string[]]>([
    [
      'cv',
      'en',
      ['Show me his Kotlin experience', 'Switch the page to Ukrainian', 'Scroll to the apps'],
    ],
    [
      'profile',
      'en',
      ['Show his selected impact', 'Switch the page to Ukrainian', 'Scroll to the apps'],
    ],
    [
      'profile',
      'uk',
      [
        'Покажи його вибрані результати',
        'Перемкни сторінку на англійську',
        'Прокрути до застосунків',
      ],
    ],
  ])('offers the %s page’s example commands (%s)', async (page, locale, commands) => {
    await renderOpenChat(locale, { page, withTools: true });
    expect(texts(chatTestIds.command)).toEqual(commands);
  });

  it.each<[ChatPage, Locale, string, string]>([
    ['cv', 'en', 'AI assistant · answers from this CV', 'I answer from his CV.'],
    ['cv', 'uk', 'ШІ-асистент · відповідає за резюме', 'я відповідаю на основі його резюме.'],
    ['profile', 'en', 'AI assistant · answers from this page', 'I answer from this page.'],
    [
      'profile',
      'uk',
      'ШІ-асистент · відповідає за цією сторінкою',
      'я відповідаю на основі цієї сторінки.',
    ],
  ])('says what it answers from on the %s page (%s)', async (page, locale, subtitle, greeting) => {
    await renderOpenChat(locale, { page });
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(subtitle);
    expect(inList().getAllByRole('listitem')[0]).toHaveTextContent(new RegExp(`${greeting}$`));
  });

  it.each<[ChatPage, string]>([
    ['cv', '/'],
    ['profile', '/new'],
  ])('sends the page (%s) and its route (%s) with every request', async (page, route) => {
    const { repository, user } = await renderOpenChat('en', { page, withTools: true });
    repository
      .reply(...toolTurn('', { name: 'scrollToSection', input: { section: 'apps' } }))
      .reply(...answer('Here.'));

    await user.click(firstSuggestion());
    await inList().findByText('Here.');

    expect(repository.requests).toHaveLength(2);
    for (const request of repository.requests) expect(request).toMatchObject({ page });
    expect(repository.requests[0]?.messages[0]).toMatchObject({ page: { route } });
  });
});

describe('chat actions on /new', () => {
  it('names /new’s sections and items in the chips', async () => {
    const { repository, user } = await renderOpenChat('en', { page: 'profile', withTools: true });
    repository
      .reply(
        ...toolTurn(
          '',
          { name: 'scrollToSection', input: { section: 'impact' } },
          { name: 'highlightElement', input: { target: 'experience:transcenda' } },
          { name: 'highlightElement', input: { target: 'skill:ai-engineering' } },
        ),
      )
      .reply(...answer('Done.'));

    await user.click(screen.getByRole('button', { name: 'Show his selected impact' }));
    await inList().findByText('Done.');

    expect(texts(chatTestIds.actionChip)).toEqual([
      'Scrolled to Selected impact',
      'Showing Transcenda',
      'Showing AI Engineering',
    ]);
  });

  it('Ukrainian: section and item names come from the page in Ukrainian', async () => {
    const { repository, user } = await renderOpenChat('uk', { page: 'profile', withTools: true });
    repository
      .reply(
        ...toolTurn(
          '',
          { name: 'scrollToSection', input: { section: 'loop' } },
          { name: 'highlightElement', input: { target: 'skill:quality' } },
        ),
      )
      .reply(...answer('Готово.'));

    await user.click(firstSuggestion());
    await inList().findByText('Готово.');

    expect(texts(chatTestIds.actionChip)).toEqual([
      'Прокручено: Як я будую з агентами',
      'Показано: Якість',
    ]);
  });

  it('confirms a contact with /new’s own email before it opens', async () => {
    const { repository, executor, user } = await renderOpenChat('en', {
      page: 'profile',
      withTools: true,
    });
    repository
      .reply(...toolTurn('', { name: 'openContact', input: { channel: 'email' } }))
      .reply(...answer('Opened.'));

    await user.click(firstSuggestion());

    const card = await screen.findByTestId(chatTestIds.confirmation);
    expect(card).toHaveTextContent('Write an email to Andrew?');
    expect(card).toHaveTextContent('andriipanasiuk@gmail.com');
    expect(executor.executed).toHaveLength(0);
    await user.click(within(card).getByTestId(chatTestIds.confirmAction));
    expect(await inList().findByText('Opened.')).toBeInTheDocument();
    expect(executor.executed).toHaveLength(1);
  });
});
