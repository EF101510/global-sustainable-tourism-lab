import { useEffect } from 'react';

/**
 * Lock background scrolling while a modal / overlay is open so touch drags
 * inside it don't "leak" through and scroll the page behind it (iOS scroll
 * chaining / rubber-banding).
 *
 * Pinning the body with `position: fixed` is the only reliable way to stop
 * iOS Safari from rubber-band scrolling the viewport — `overflow: hidden`
 * alone is ignored there. We preserve the current scroll offset and restore
 * it (and the original inline styles) on cleanup. No-op while `active` is
 * false, so callers can pass an `open` flag directly.
 */
export function useScrollLock(active: boolean = true): void {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const scrollY = window.scrollY;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
