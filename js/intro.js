/* Standalone dusk prologue. Shared navigation styles; preferences saved only with existing consent. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const root = document.querySelector('.intro');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const route = get('route'), length = route.getTotalLength();
  let elapsed = 0, previous = null, paused = false, chapter = -1, frame;
  let opening = null, target = null;   // opening shot state and final camera (see OPENING SHOT)
  let context, master, music = true;
  const preferences = {
    get(key) { try { return localStorage.getItem('oc-consent') === 'yes' ? localStorage.getItem(key) : null; } catch (_) { return null; } },
    set(key, value) { try { if (localStorage.getItem('oc-consent') === 'yes') localStorage.setItem(key, value); } catch (_) {} }
  };
  music = preferences.get('oc-music') !== 'off';
  let userMotionOff = preferences.get('oc-motion') === 'off';
  function announce(message) {
    const status = get('a11y-status');
    status.style.top = `${document.querySelector('.oc-a11ybar').getBoundingClientRect().bottom + 8}px`;
    status.textContent = message;
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => { status.textContent = ''; }, 5000);
  }
  function syncMusic() {
    get('music-toggle').setAttribute('aria-pressed', String(music));
    get('music-state').textContent = music ? 'on' : 'off';
  }
  const duration = 30000;
  // Anchor the leader directly to the actual curved riser geometry.
  const anchor = route.getPointAtLength(length * .65);
  get('riser-callout').setAttribute('d', `M786 468 L${anchor.x} ${anchor.y}`);
  get('riser-anchor').setAttribute('cx', anchor.x);
  get('riser-anchor').setAttribute('cy', anchor.y);
  const chapters = [
    ['01 / From the seabed', 'Oil, water and gas begin their journey from the subsea well.'],
    ['02 / Through the riser', 'The production mixture rises through the riser towards the surface.'],
    ['03 / Arrival at the FPSO', 'At the FPSO, the mixture enters the production plant for treatment.'],
    ['04 / Before your shift', 'Production continues. Soon, you will take over the offshore instrumentation shift.']
  ];
  const staticMotion = () => reduce.matches || document.documentElement.dataset.motion === 'off';
  function draw() {
    const t = Math.min(elapsed / duration, 1);
    const point = route.getPointAtLength(length * Math.min(t / .82, 1));
    get('flow-head').setAttribute('cx', point.x);
    get('flow-head').setAttribute('cy', point.y);
    get('flow-head').hidden = staticMotion();
    get('flow-head').style.display = staticMotion() ? 'none' : '';
    get('progress').style.width = `${t * 100}%`;
    const next = Math.min(3, Math.floor(t * 4));
    if (next !== chapter) {
      chapter = next;
      const caption = get('intro-caption');
      caption.dataset.chapter = String(next + 1);
      if (!staticMotion() && !caption.hidden && caption.animate) {
        if (caption.chapterAnimation) caption.chapterAnimation.cancel();
        caption.chapterAnimation = get('narration').animate(
          [{opacity: .65, transform: 'translateY(3px)'}, {opacity: 1, transform: 'translateY(0)'}],
          {duration: 420, easing: 'ease-out'}
        );
      }
      get('chapter').textContent = chapters[next][0];
      get('narration').textContent = chapters[next][1];
      get('previous-chapter').disabled = next === 0;
      get('next-chapter').disabled = next === 3;
    }
  }
  function tick(now) {
    if (previous !== null && !paused && !opening && !document.hidden && !staticMotion()) elapsed = Math.min(duration, elapsed + now - previous);
    previous = now;
    // Light mode: redraw the flow dot at about 30 fps (time still counts every frame).
    if (!root.hasAttribute('data-pinch') && (!document.documentElement.hasAttribute('data-intro-lite') || now - (tick.drawn || 0) >= 32)) { tick.drawn = now; draw(); }
    if (!paused && !document.hidden && !staticMotion()) frame = requestAnimationFrame(tick);

  }
  function update() {
    if (opening && staticMotion()) finishOpening();   // Animations off or Reduce motion: jump to the final view
    cancelAnimationFrame(frame); previous = null;
    document.documentElement.toggleAttribute('data-motion', userMotionOff);
    if (userMotionOff) document.documentElement.dataset.motion = 'off';
    get('motion-toggle').setAttribute('aria-pressed', String(!staticMotion()));
    get('motion-toggle').setAttribute('aria-disabled', String(reduce.matches));
    get('motion-state').textContent = reduce.matches ? 'off by system setting' : userMotionOff ? 'off' : 'on';
    root.toggleAttribute('data-static', staticMotion());
    if (staticMotion()) root.removeAttribute('data-revealing');
    if (staticMotion() && get('intro-caption').chapterAnimation) get('intro-caption').chapterAnimation.cancel();
    root.toggleAttribute('data-paused', paused || document.hidden);
    get('pause').textContent = staticMotion() ? 'Reduced motion enabled' : paused ? 'Resume' : 'Pause';
    get('pause').disabled = staticMotion();
    get('pause').setAttribute('aria-pressed', String(paused));
    if (!staticMotion() && !paused && !document.hidden) frame = requestAnimationFrame(tick);
    if (master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(music && !paused && !document.hidden ? Number(get('music-volume').value) / 100 * .18 : 0, context.currentTime, .25);
    }
    get('flow-head').style.display = staticMotion() ? 'none' : '';
  }
  get('pause').addEventListener('click', () => { paused = !paused; update(); });
  get('restart').addEventListener('click', () => { get('intro-caption').hidden = false; elapsed = 0; chapter = -1; paused = false; draw(); update(); });
  async function startAudio() {
    try {
      if (!context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw new Error('Audio unavailable');
        context = new Audio(); master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
        // START: INTRO SOUNDSCAPE (all synthesized, no audio files)
        // 1. Sea: soft filtered noise that swells and recedes like waves.
        const noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate), data = noise.getChannelData(0);
        for (let i = 0, last = 0; i < data.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; data[i] = last * 3.5; }
        const sea = context.createBufferSource(); sea.buffer = noise; sea.loop = true;
        const seaFilter = context.createBiquadFilter(); seaFilter.type = 'lowpass'; seaFilter.frequency.value = 700;
        const seaGain = context.createGain(); seaGain.gain.value = .35;
        const swell = context.createOscillator(), swellDepth = context.createGain();
        swell.frequency.value = .09; swellDepth.gain.value = .25; swell.connect(swellDepth); swellDepth.connect(seaGain.gain);
        sea.connect(seaFilter); seaFilter.connect(seaGain); seaGain.connect(master); sea.start(); swell.start();
        // 2. Music: a slow cycle of four warm chords (about 64 s) with a gentle
        //    melody on top, so it no longer sounds like one held note.
        const chords = [[130.81, 196, 246.94, 329.63], [110, 164.81, 220, 261.63], [87.31, 130.81, 174.61, 220], [98, 146.83, 196, 246.94]];
        const melody = [392, 440, 329.63, 293.66, 329.63, 392, 440, 523.25, 440, 392, 329.63, 293.66, 261.63, 293.66, 329.63, 293.66];
        const tone = (frequency, start, length, level, type) => {
          const oscillator = context.createOscillator(), gain = context.createGain();
          oscillator.type = type; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(level, start + Math.min(1, length * .35));
          gain.gain.linearRampToValueAtTime(0, start + length);
          oscillator.connect(gain); gain.connect(master); oscillator.start(start); oscillator.stop(start + length + .1);
        };
        // 3. Seagulls: an occasional distant call, a short gliding whistle.
        const gull = start => [0, .28].forEach(offset => {
          const oscillator = context.createOscillator(), gain = context.createGain(), t = start + offset;
          oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(1500, t); oscillator.frequency.exponentialRampToValueAtTime(900, t + .22);
          gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(.025, t + .04); gain.gain.linearRampToValueAtTime(0, t + .24);
          oscillator.connect(gain); gain.connect(master); oscillator.start(t); oscillator.stop(t + .3);
        });
        // Schedules one 64 s cycle at a time, only while the context is alive.
        const cycle = () => {
          const now = context.currentTime + .1;
          chords.forEach((chord, i) => chord.forEach(f => tone(f, now + i * 16, 17, .07, 'sine')));
          melody.forEach((f, i) => tone(f, now + .5 + i * 4, 3.6, .035, 'triangle'));
          [9, 31, 50].forEach(at => gull(now + at + Math.random() * 4));
          setTimeout(cycle, 64000);
        };
        cycle();
        // END: INTRO SOUNDSCAPE
      }
      await context.resume();
      syncMusic(); update();
    } catch (_) { get('sound-note').textContent = 'Music could not start in this browser. The introduction remains available without audio.'; }
  }
  function navigateChapter(offset) {
    const next = Math.max(0, Math.min(3, chapter + offset));
    elapsed = next * duration / 4;
    draw(); update();
    // Keep keyboard focus on an available arrow at the boundaries.
    if (next === 0) get('next-chapter').focus();
    if (next === 3) get('previous-chapter').focus();
  }
  get('previous-chapter').addEventListener('click', () => navigateChapter(-1));
  get('next-chapter').addEventListener('click', () => navigateChapter(1));
  get('close-caption').addEventListener('click', () => {
    get('intro-caption').hidden = true;
    get('restart').focus();
  });
  get('music-toggle').addEventListener('click', () => {
    music = !music;
    preferences.set('oc-music', music ? 'on' : 'off');
    announce(music ? 'Music on.' : 'Music off.');
    syncMusic();
    if (music) startAudio(); else update();
  });
  const unlockAudio = event => {
    if (event.target.closest('#music-toggle')) return;
    if (music && (!context || context.state === 'suspended')) startAudio();
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  get('music-volume').addEventListener('input', () => { get('music-volume-value').textContent = get('music-volume').value + '%'; get('music-volume').setAttribute('aria-valuetext', `${get('music-volume').value}%`); update(); });
  get('motion-toggle').addEventListener('click', () => {
    if (reduce.matches) { announce('Animations are turned off by your system’s accessibility settings.'); return; }
    userMotionOff = !userMotionOff;
    preferences.set('oc-motion', userMotionOff ? 'off' : 'on');
    update();
    announce(userMotionOff ? 'Animations off.' : 'Animations on.');
  });
  document.addEventListener('visibilitychange', update);
  // Drawing scrolled out of view (common on phones): its CSS loops pause (css/intro.css · PERFORMANCE).
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => root.toggleAttribute('data-offscreen', !entry.isIntersecting))
      .observe(document.querySelector('.intro-scene'));
  }
  reduce.addEventListener('change', update);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); if (context) context.close(); });
  // Camera depends only on the viewport, never on narration or panel heights.
  const scene = document.querySelector('.intro-scene');
  const bar = document.querySelector('.oc-a11ybar');
  function fitScene() {
    const barHeight = bar.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--intro-bar-height', `${barHeight}px`);
    const viewportWidth = document.documentElement.clientWidth;
    // clientHeight (layout viewport) does not change with pinch zoom; innerHeight does on phones.
    const viewportHeight = Math.max(1, document.documentElement.clientHeight - barHeight);
    const narrow = viewportWidth <= 700;
    const topInset = narrow ? 190 : 0;
    const sceneHeight = Math.max(180, viewportHeight - topInset - (narrow ? 230 : 180));
    const scale = Math.min(viewportWidth / 1200, sceneHeight / 760);
    const width = viewportWidth / scale;
    const height = viewportHeight / scale;
    const top = (topInset + Math.max(0, sceneHeight - 760 * scale) / 2) / scale;
    target = [(1200 - width) / 2, -top, width, height];
    const viewBox = target.join(' ');
    if (scene.dataset.camera !== viewBox) scene.dataset.camera = viewBox;   // final camera, read by intro-habitat.js
    if (scene.getAttribute('viewBox') !== viewBox) scene.setAttribute('viewBox', viewBox);
  }

  // START: OPENING SHOT (the camera starts on a starfish and zooms out to the whole scene)
  // Runs once when the page loads, only when animations are allowed. The drawing
  // is framed once, then the whole SVG is scaled with a CSS transform (Web
  // Animations API): the graphics card moves it, so the zoom stays smooth even on
  // phones. Any key, click, tap, scroll or focus skips straight to the final view.
  // Timing: OPENING_HOLD = pause on the starfish, OPENING_ZOOM = zoom length (ms),
  // OPENING_DEPTH = how close the camera starts (times the final size).
  const OPENING_HOLD = 500, OPENING_ZOOM = 4200, OPENING_DEPTH = 2.25;
  const skipEvents = ['keydown', 'pointerdown', 'wheel', 'touchstart', 'click'];
  const skipOpening = () => finishOpening();
  function finishOpening() {
    if (!opening) return;
    const shot = opening;
    opening = null;
    if (shot.animation) shot.animation.cancel();
    scene.style.willChange = '';
    skipEvents.forEach(type => document.removeEventListener(type, skipOpening, true));
    root.removeEventListener('focusin', skipOpening);
    root.removeAttribute('data-opening');
    if (!staticMotion()) {                         // the skipping tap must not press a still-invisible button
      root.setAttribute('data-revealing', '');
      clearTimeout(finishOpening.timer);
      finishOpening.timer = setTimeout(() => root.removeAttribute('data-revealing'), 900);
    }
    if (target) scene.setAttribute('viewBox', target.join(' '));
    previous = null; update();                     // the narration starts now
  }
  function startOpening() {
    const star = get('opening-star');
    if (!star || !target || staticMotion() || !scene.animate) return;
    try {
      opening = {};
      root.setAttribute('data-opening', '');
      const frame = scene.getBoundingClientRect(), box = star.getBoundingClientRect();
      const ox = box.left + box.width / 2 - frame.left, oy = box.top + box.height / 2 - frame.top;
      const dx = frame.width / 2 - ox, dy = frame.height / 2 - oy;   // brings the starfish to the centre
      const total = OPENING_HOLD + OPENING_ZOOM;
      scene.style.transformOrigin = `${ox}px ${oy}px`;
      scene.style.willChange = 'transform';   // drawn once at normal size, then only moved (no heavy redraws)
      opening.animation = scene.animate([
        {transform: `translate(${dx}px, ${dy}px) scale(${OPENING_DEPTH})`, offset: 0},
        {transform: `translate(${dx}px, ${dy}px) scale(${OPENING_DEPTH})`, offset: OPENING_HOLD / total, easing: 'cubic-bezier(.6, 0, .25, 1)'},
        {transform: 'translate(0, 0) scale(1)', offset: 1}
      ], {duration: total, easing: 'linear', fill: 'none'});
      opening.animation.onfinish = finishOpening;
      skipEvents.forEach(type => document.addEventListener(type, skipOpening, {capture: true, passive: true}));
      root.addEventListener('focusin', skipOpening);
    } catch (_) { finishOpening(); }
  }
  // END: OPENING SHOT
  if (window.ResizeObserver) new ResizeObserver(fitScene).observe(bar);
  // While the page is pinch-zoomed, the drawing holds still. Phones only paint the
  // part of a moving drawing that is on screen, so zooming back out showed empty
  // strips at the sides; a still drawing is painted in full.
  if (window.visualViewport) {
    const pinch = () => root.toggleAttribute('data-pinch', visualViewport.scale > 1.01);
    visualViewport.addEventListener('resize', pinch);
    document.addEventListener('touchstart', e => { if (e.touches.length > 1) root.setAttribute('data-pinch', ''); }, {passive: true});
    document.addEventListener('touchend', () => setTimeout(pinch, 400), {passive: true});
  }
  // Pinch zoom also fires resize: ignore it while zoomed, so the drawing is not re-framed.
  window.addEventListener('resize', () => { if (!window.visualViewport || Math.abs(visualViewport.scale - 1) < .01) fitScene(); });
  if (document.fonts) document.fonts.ready.then(fitScene);
  fitScene();
  syncMusic(); draw(); update();
  startOpening();
  document.documentElement.removeAttribute('data-intro-opening');   // set early by js/intro-preload.js
})();






