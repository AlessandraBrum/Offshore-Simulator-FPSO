/* ==========================================================================
   START: SAVED MOTION PREFERENCE
   Only exists if the person agreed to save their progress.
   Loaded in the <head> without "defer", so it runs before the page appears
   and nothing moves by mistake.
   The system's "Reduce motion" setting is handled in the CSS and always wins.
   ========================================================================== */
(function () {
  try {
    if (localStorage.getItem('oc-motion') === 'off') {
      document.documentElement.setAttribute('data-motion', 'off');
    }
  } catch (e) { /* storage blocked: keep the default */ }
})();
/* ==========================================================================
   END: SAVED MOTION PREFERENCE
   ========================================================================== */
