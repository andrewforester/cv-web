import { fireEvent, screen, waitFor } from '@testing-library/react';
import { chatTestIds } from './testIds';
import { ManualVoiceClient, renderVoiceChat } from './voice/voiceTestHarness';

// docs/design/voice/SPEC.md → The composer's fine print: one line under the row in every view, so
// the row (Call / End + Mute + the field) never moves between text, call and callChat.
const field = () => screen.getByTestId(chatTestIds.input);
const meta = () => screen.getByTestId(chatTestIds.meta);

/** The composer is the row, then the one fine-print line, and the field reads that line. */
function expectRowThenFinePrint(text: string) {
  const form = field().closest('form');
  expect(form?.children).toHaveLength(2);
  expect(form?.lastElementChild).toBe(meta());
  expect(form?.firstElementChild).toContainElement(field());
  expect(field()).toHaveAttribute('aria-describedby', meta().id);
  expect(meta()).toHaveTextContent(text);
}

describe('the composer’s fine print', () => {
  it('is the same one line under the row in text, call (connecting, live) and callChat', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.fab));
    expectRowThenFinePrint('AI can make mistakes.');
    const line = meta();

    // Connecting: the line carries the call's privacy note; the stage has no paragraph of its own.
    await user.click(screen.getByTestId(chatTestIds.voiceCall));
    expectRowThenFinePrint('Calls run on ElevenLabs and see your chat.');
    expect(screen.getAllByText(/ElevenLabs/)).toEqual([meta().firstElementChild]);
    expect(meta()).toBe(line);

    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });
    expectRowThenFinePrint('AI can make mistakes.');

    await user.click(screen.getByTestId(chatTestIds.voiceChatToggle));
    expectRowThenFinePrint('AI can make mistakes.');
    expect(meta()).toBe(line);
  });

  it('puts the counter and the too-long message on the same line, during a call too', async () => {
    const client = new ManualVoiceClient();
    const { user } = await renderVoiceChat({ client });
    await user.click(screen.getByTestId(chatTestIds.fab));
    fireEvent.change(field(), { target: { value: 'x'.repeat(800) } });
    expectRowThenFinePrint('AI can make mistakes.800 / 1000');

    await user.click(screen.getByTestId(chatTestIds.voiceCall));
    await waitFor(() => expect(client.call).not.toBeNull());
    client.emit({ type: 'status', status: 'live' });
    expectRowThenFinePrint('AI can make mistakes.800 / 1000');

    fireEvent.change(field(), { target: { value: 'x'.repeat(1043) } });
    expectRowThenFinePrint('Shorten to 1000 characters.1043 / 1000');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });
});
