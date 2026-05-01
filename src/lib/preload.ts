/**
 * Image preload helpers — kick off browser HTTP fetches in advance so that
 * by the time a component renders `background-image: url(...)`, the image
 * is already in the cache and paints instantly.
 *
 * Implementation: just create a detached `Image` and set `src`. The browser
 * issues the network request and caches the response; we don't need to keep
 * the `Image` reference alive — once the response is cached, the next
 * consumer (a `<div style="background-image">` or `<img>`) hits the cache.
 */

const requested = new Set<string>();

export function preloadImage(url: string): void {
  if (!url || requested.has(url)) return;
  requested.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

export function preloadImages(urls: readonly string[]): void {
  for (const url of urls) preloadImage(url);
}
