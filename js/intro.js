/* Standalone daylight prologue. Shared navigation styles; preferences saved only with existing consent. */
(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const root = document.querySelector('.intro');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const route = get('route'), length = route.getTotalLength();
  let elapsed = 0, previous = null, paused = false, chapter = -1, frame;
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
    ['02 / Through the riser', 'The production mixture rises through the riser toward the surface.'],
    ['03 / Arrival at the FPSO', 'At the FPSO, the mixture enters the production system for treatment.'],
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
    if (previous !== null && !paused && !document.hidden && !staticMotion()) elapsed = Math.min(duration, elapsed + now - previous);
    previous = now;
    draw();
    if (!paused && !document.hidden && !staticMotion()) frame = requestAnimationFrame(tick);

  }
  function update() {
    cancelAnimationFrame(frame); previous = null;
    document.documentElement.toggleAttribute('data-motion', userMotionOff);
    if (userMotionOff) document.documentElement.dataset.motion = 'off';
    get('motion-toggle').setAttribute('aria-pressed', String(!staticMotion()));
    get('motion-toggle').setAttribute('aria-disabled', String(reduce.matches));
    get('motion-state').textContent = reduce.matches ? 'off by system setting' : userMotionOff ? 'off' : 'on';
    root.toggleAttribute('data-static', staticMotion());
    if (staticMotion() && get('intro-caption').chapterAnimation) get('intro-caption').chapterAnimation.cancel();
    root.toggleAttribute('data-paused', paused || document.hidden);
    get('pause').textContent = staticMotion() ? 'Reduced motion enabled' : paused ? 'Resume' : 'Pause';
    get('pause').disabled = staticMotion();
    get('pause').setAttribute('aria-pressed', String(paused));
    if (!staticMotion() && !paused && !document.hidden) frame = requestAnimationFrame(tick);
    if (master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(music && !paused && !document.hidden ? Number(get('music-volume').value) / 100 * .18 : 0, context.currentTime, 1.2);
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
        // Quiet original ambient chord, softened with individual slow envelopes.
        [130.81, 164.81, 196, 246.94, 293.66].forEach((frequency, i) => {
          const oscillator = context.createOscillator(), gain = context.createGain();
          oscillator.type = 'sine'; oscillator.frequency.value = frequency;
          gain.gain.value = .15; oscillator.connect(gain); gain.connect(master); oscillator.start();
          const lfo = context.createOscillator(), depth = context.createGain();
          lfo.frequency.value = .035 + i * .009; depth.gain.value = .06;
          lfo.connect(depth); depth.connect(gain.gain); lfo.start();
        });
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
  reduce.addEventListener('change', update);
  window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); if (context) context.close(); });
  // Camera depends only on the viewport, never on narration or panel heights.
  const scene = document.querySelector('.intro-scene');
  const bar = document.querySelector('.oc-a11ybar');
  function fitScene() {
    const barHeight = bar.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--intro-bar-height', `${barHeight}px`);
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = Math.max(1, window.innerHeight - barHeight);
    const narrow = viewportWidth <= 700;
    const topInset = narrow ? 190 : 0;
    const sceneHeight = Math.max(180, viewportHeight - topInset - (narrow ? 230 : 180));
    const scale = Math.min(viewportWidth / 1200, sceneHeight / 760);
    const width = viewportWidth / scale;
    const height = viewportHeight / scale;
    const top = (topInset + Math.max(0, sceneHeight - 760 * scale) / 2) / scale;
    const viewBox = `${(1200 - width) / 2} ${-top} ${width} ${height}`;
    if (scene.getAttribute('viewBox') !== viewBox) scene.setAttribute('viewBox', viewBox);
  }
  if (window.ResizeObserver) new ResizeObserver(fitScene).observe(bar);
  window.addEventListener('resize', fitScene);
  if (document.fonts) document.fonts.ready.then(fitScene);
  fitScene();
  syncMusic(); draw(); update();
})();






