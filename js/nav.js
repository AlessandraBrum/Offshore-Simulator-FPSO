/* ==========================================================================
   OFFSHORE SIMULATOR · js/nav.js
   Top bar menu, used by index.html, aboutthegame.html and devlog.html.
   From 1100px the links and controls sit in the bar. Below that, the
   "Menu" button opens a panel that slides in from the right. It closes
   with Esc, the close button, a click outside it or a click on a link.
   ========================================================================== */
(() => {
  const toggle = document.getElementById('nav-toggle');
  const panel = document.getElementById('site-menu');
  const close = document.getElementById('nav-close');
  if (!toggle || !panel) return;
  const wide = window.matchMedia('(min-width: 1100px)');

  // START: OPEN AND CLOSE
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  function setOpen(open, returnFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('oc-menu-open', open);
    if (open) { const first = panel.querySelector('a, button, input'); if (first) first.focus(); }
    else if (returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setOpen(!isOpen(), false));
  if (close) close.addEventListener('click', () => setOpen(false, true));
  // END: OPEN AND CLOSE

  // START: AUTOMATIC CLOSING (Esc, click outside, click on a link, wide screen)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) { e.preventDefault(); setOpen(false, true); }
  });
  document.addEventListener('click', e => {
    if (isOpen() && !panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false, false);
  });
  panel.querySelectorAll('.oc-nav__link').forEach(link => link.addEventListener('click', () => { if (isOpen()) setOpen(false, false); }));
  wide.addEventListener('change', () => { if (isOpen()) setOpen(false, false); });
  // END: AUTOMATIC CLOSING

  // START: KEEP THE KEYBOARD INSIDE THE OPEN PANEL (Tab and Shift+Tab loop)
  panel.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !isOpen()) return;
    const items = [...panel.querySelectorAll('a, button, input')].filter(el => el.offsetParent !== null);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // END: KEEP THE KEYBOARD INSIDE THE OPEN PANEL

  // Preserve old bookmarked start-shift links with the current Phase 1 destination.
  if (location.hash === '#start-shift') location.replace('phase1.html');
})();
