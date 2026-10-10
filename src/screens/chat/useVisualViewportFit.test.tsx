import { render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useVisualViewportFit } from './useVisualViewportFit';

function Probe({ sheet }: { sheet: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useVisualViewportFit(ref, sheet);
  return (
    <div ref={ref} data-testid="dialog">
      <textarea data-testid="field" />
    </div>
  );
}

function mockViewport(height: number, offsetTop: number) {
  const target = new EventTarget() as EventTarget & { height: number; offsetTop: number };
  target.height = height;
  target.offsetTop = offsetTop;
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: target });
  return target;
}

describe('useVisualViewportFit', () => {
  beforeEach(() => {
    window.innerHeight = 844;
  });
  afterEach(() => Reflect.deleteProperty(window, 'visualViewport'));

  it('follows the visual viewport while the sheet is open', () => {
    const viewport = mockViewport(844, 0);
    const { getByTestId } = render(<Probe sheet />);
    const dialog = getByTestId('dialog');
    expect(dialog.style.getPropertyValue('--chat-vv-height')).toBe('844px');

    expect(dialog.style.getPropertyValue('--chat-vv-bottom')).toBe('0px');

    // The keyboard opens for the field over a 844 px layout viewport; the visual one scrolls 30 px.
    getByTestId('field').focus();
    viewport.height = 450;
    viewport.offsetTop = 30;
    viewport.dispatchEvent(new Event('resize'));
    expect(dialog.style.getPropertyValue('--chat-vv-height')).toBe('450px');
    expect(dialog.style.getPropertyValue('--chat-vv-bottom')).toBe('364px');

    // The field loses focus: the keyboard is closing, the sheet goes back to the bottom.
    getByTestId('field').blur();
    expect(dialog.style.getPropertyValue('--chat-vv-bottom')).toBe('0px');
  });

  it('keeps the sheet at the bottom without a focused field (Chrome URL bar gap)', () => {
    const viewport = mockViewport(844, 0);
    const { getByTestId } = render(<Probe sheet />);
    viewport.height = 784;
    viewport.dispatchEvent(new Event('resize'));
    expect(getByTestId('dialog').style.getPropertyValue('--chat-vv-bottom')).toBe('0px');
  });

  it('does nothing outside the sheet layout', () => {
    mockViewport(450, 0);
    const { getByTestId } = render(<Probe sheet={false} />);
    expect(getByTestId('dialog').style.getPropertyValue('--chat-vv-height')).toBe('');
  });

  it('clears the properties on unmount of the sheet', () => {
    mockViewport(450, 0);
    const { getByTestId, rerender } = render(<Probe sheet />);
    rerender(<Probe sheet={false} />);
    expect(getByTestId('dialog').style.getPropertyValue('--chat-vv-height')).toBe('');
  });
});
