import { useEffect } from 'react';

/** Puts a class on `body` while `on` (the show's portal lives outside the app's tree). */
export function useBodyClass(className: string | undefined, on: boolean) {
  useEffect(() => {
    if (!className || !on) return;
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className, on]);
}
