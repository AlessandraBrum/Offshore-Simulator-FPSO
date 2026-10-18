/* Offshore Simulator · js/intro-preload.js
   Loaded in the <head> of intro.html, before the page is drawn. When animations
   are allowed, it hides the page for a moment so the opening shot (js/intro.js)
   can start on the starfish without a flash of the full scene. js/intro.js
   removes the flag; a 3 s safety timer removes it too, whatever happens. */
try {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'off') {
    document.documentElement.setAttribute('data-intro-opening', '');
    setTimeout(() => document.documentElement.removeAttribute('data-intro-opening'), 3000);
  }
} catch (_) {}

/* START: LIGHT MODE (the same scene for everyone, on every device)
   html[data-intro-lite] draws fewer fish, rocks and bubbles and stops the
   small decorative loops (see css/intro.css · PERFORMANCE). */
document.documentElement.setAttribute('data-intro-lite', '');
/* END: LIGHT MODE */
