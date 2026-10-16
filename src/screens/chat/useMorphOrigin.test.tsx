import { render } from '@testing-library/react';
import { useRef, type RefObject } from 'react';
import { describe, expect, it } from 'vitest';
import type { ChatSurface } from './chatSurface';
import { useMorphOrigin } from './useMorphOrigin';

interface ProbeProps {
  surface: ChatSurface;
  launcher?: boolean;
  callPill?: boolean;
}

/** Fills `ref` with a pill whose box jsdom reports as `width` × 48. */
function sized<T extends HTMLElement>(ref: RefObject<T | null>, width: number) {
  return (element: T | null) => {
    if (element) element.getBoundingClientRect = () => new DOMRect(0, 0, width, 48);
    ref.current = element;
  };
}

function Probe({ surface, launcher = false, callPill = false }: ProbeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const callPillRef = useRef<HTMLDivElement>(null);
  useMorphOrigin(rootRef, surface, launcherRef, callPillRef);
  return (
    <div ref={rootRef} data-testid="root">
      {launcher && <button ref={sized(launcherRef, 172)} />}
      {callPill && <div ref={sized(callPillRef, 212)} />}
    </div>
  );
}

const morph = (root: HTMLElement) => [
  root.style.getPropertyValue('--chat-morph-w'),
  root.style.getPropertyValue('--chat-morph-h'),
];

describe('useMorphOrigin', () => {
  it('measures the launcher the panel grows out of', () => {
    const { getByTestId } = render(<Probe surface="closed" launcher />);
    expect(morph(getByTestId('root'))).toEqual(['172px', '48px']);
  });

  it('measures the call pill when there is no launcher, on the surface change', () => {
    const { getByTestId, rerender } = render(<Probe surface="call" />);
    rerender(<Probe surface="callPill" callPill />);
    expect(morph(getByTestId('root'))).toEqual(['212px', '48px']);
  });

  it('prefers the launcher when both pills are mounted', () => {
    const { getByTestId } = render(<Probe surface="closed" launcher callPill />);
    expect(morph(getByTestId('root'))).toEqual(['172px', '48px']);
  });

  it('writes nothing without a pill (the CSS falls back to a 48 px circle)', () => {
    const { getByTestId } = render(<Probe surface="text" />);
    expect(morph(getByTestId('root'))).toEqual(['', '']);
  });
});
