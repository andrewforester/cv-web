import { render } from '@testing-library/react';
import { createRef } from 'react';
import { AppProviders } from '../../app/AppProviders';
import { ChatLauncher } from './ChatLauncher';
import { PULSE_COUNT } from './useLauncherIntro';

/** The launcher's motion tokens as `src/theme/tokens.css` has them (jsdom doesn't load the theme). */
const TOKENS: Record<string, string> = {
  '--motion-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  '--motion-duration': '.9s',
  // The build writes durations in seconds.
  '--motion-pulse-duration': '2s',
  '--motion-pulse-color': 'rgba(139, 92, 246, 0.55)',
  '--motion-pulse-color-end': 'rgba(139, 92, 246, 0)',
  '--motion-pulse-spread': '14px',
  '--shadow-launcher': '0 16px 40px -12px rgba(139, 92, 246, 0.45)',
};

interface Call {
  el: Element;
  options: KeyframeAnimationOptions;
}

function setUp({ reduced = false, now = 300 } = {}) {
  const calls: Call[] = [];
  Object.entries(TOKENS).forEach(([name, value]) =>
    document.documentElement.style.setProperty(name, value),
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({ matches: reduced && query.includes('reduce') })),
  );
  vi.spyOn(performance, 'now').mockReturnValue(now);
  Element.prototype.animate = vi.fn(function animate(
    this: Element,
    _: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    calls.push({ el: this, options });
    return { cancel: vi.fn(), onfinish: null } as unknown as Animation;
  }) as unknown as Element['animate'];
  const fabRef = createRef<HTMLButtonElement>();
  render(
    <AppProviders>
      <ChatLauncher fabRef={fabRef} hintVisible={false} onOpen={vi.fn()} onDismissHint={vi.fn()} />
    </AppProviders>,
  );
  return { calls, fab: fabRef.current };
}

describe('the launcher intro', () => {
  afterEach(() => {
    Object.keys(TOKENS).forEach((name) => document.documentElement.style.removeProperty(name));
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (Element.prototype as Partial<Element>).animate;
  });

  it('rises in at 1.5 s and pulses exactly twice from 2.6 s after load', () => {
    const { calls, fab } = setUp({ now: 300 });
    const [entry, pulse] = calls;
    expect(entry?.options).toMatchObject({ delay: 1200, duration: 900, fill: 'both' });
    expect(pulse?.el).toBe(fab);
    expect(PULSE_COUNT).toBe(2);
    expect(pulse?.options).toMatchObject({ delay: 2300, duration: 2000, iterations: 2 });
  });

  it('does not move with reduced motion', () => {
    expect(setUp({ reduced: true }).calls).toEqual([]);
  });

  it('does not replay when it comes back after the pulses are over', () => {
    expect(setUp({ now: 7000 }).calls).toEqual([]);
  });
});
