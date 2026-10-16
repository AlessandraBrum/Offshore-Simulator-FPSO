/* ==========================================================================
   OFFSHORE SIMULATOR · PUBLIC PREVIEW · js/main.js
   Built by tools/build.mjs: intro, music, phases menu and privacy only.
   ========================================================================== */
const byId = id => document.getElementById(id);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
function enterGame() {}            // no game in this build
function leaveGame() {}


/* ==========================================================================
   START: 1.1 STORAGE WITH CONSENT (LGPD)
   Nothing is written to the browser before the person accepts the privacy
   notice. The only exception is the answer to the notice itself, which has
   to be remembered so the notice does not show up again on every visit.
   ========================================================================== */
const Store = (() => {
  const CONSENT = 'oc-consent';
  const read = key => { try { return localStorage.getItem(key); } catch (e) { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /* storage blocked: applies to this visit only */ } };
  const remove = key => { try { localStorage.removeItem(key); } catch (e) {} };
  return {
    consent: () => read(CONSENT),                       // 'yes', 'no' or null (not answered yet)
    setConsent(value) { write(CONSENT, value); },
    get: key => (read(CONSENT) === 'yes' ? read(key) : null),
    set(key, value) { if (read(CONSENT) === 'yes') write(key, value); },
    eraseAll() { ['oc-progress', 'oc-motion'].forEach(remove); }
  };
})();
/* ==========================================================================
   END: 1.1 STORAGE WITH CONSENT
   ========================================================================== */


/* ==========================================================================
   START: 2. MOTION (ANIMATIONS)
   Rule: the operating system's "Reduce motion" setting ALWAYS turns everything off.
   The page button can only turn things off; it never turns back on what the system turned off.
   The CSS applies the same rules (animation and transition with !important),
   so even a JavaScript error cannot make anything move.
   ========================================================================== */
const Motion = (() => {
  const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const button = byId('motion-toggle');
  const stateText = byId('motion-state');
  const listeners = [];
  let userOff = document.documentElement.getAttribute('data-motion') === 'off';

  const allowed = () => !systemReduce.matches && !userOff;

  function save() {
    Store.set('oc-motion', userOff ? 'off' : 'on');   // only saved with consent
  }

  function apply() {
    if (userOff) document.documentElement.setAttribute('data-motion', 'off');
    else document.documentElement.removeAttribute('data-motion');
    if (systemReduce.matches) {
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-disabled', 'true');
      stateText.textContent = 'off by system setting';
    } else {
      button.removeAttribute('aria-disabled');
      button.setAttribute('aria-pressed', String(!userOff));
      stateText.textContent = userOff ? 'off' : 'on';
    }
    listeners.forEach(fn => fn(allowed()));
  }

  button.addEventListener('click', () => {
    if (systemReduce.matches) {
      announce('Animations are turned off by your system’s accessibility settings. To turn them on, change that setting on your system.');
      return;
    }
    userOff = !userOff;
    save();
    apply();
    announce(userOff ? 'Animations off.' : 'Animations on.');
  });
  // If the person changes the system setting while the page is open, the page complies right away.
  if (systemReduce.addEventListener) systemReduce.addEventListener('change', apply);
  else if (systemReduce.addListener) systemReduce.addListener(apply);

  apply();
  return { allowed, onChange(fn) { listeners.push(fn); } };
})();

/* Short message in a role="status" region (read by the screen reader and visible on screen). */
// Shows a short notice in the corner (and reads it out to screen readers).
// It disappears on its own after 5 seconds.
let announceTimer = 0;
function announce(text) {
  const el = byId('a11y-status');
  el.textContent = '';
  clearTimeout(announceTimer);
  const bar = document.querySelector('.oc-a11ybar');
  el.style.top = Math.max(8, (bar ? bar.getBoundingClientRect().bottom : 0) + 8) + 'px';   // just below the bar, even when it wraps onto two lines
  setTimeout(() => { el.textContent = text; }, 50);
  announceTimer = setTimeout(() => { el.textContent = ''; }, 5050);
}
/* ==========================================================================
   END: 2. MOTION (ANIMATIONS)
   ========================================================================== */


/* ==========================================================================
   START: 9. FPSO IN THE STORM SCENE (decorative canvas for the intro)
   Original drawing, no third-party images. No lightning or flashes:
   nothing blinks. With motion turned off, it shows a still frame.
   The loop stops when off screen, when the tab is hidden and during the game.
   Layers, back to front:
     1. sky with heavy clouds, lit from below by the flare flame;
     2. distant semi-submersible platform on the horizon;
     3. background sea;
     4. FPSO (rolls, rises and falls with the waves);
     5. foreground waves covering the hull, with foam and spray;
     6. rain at three depths, slanted by gusting wind;
     7. rain curtains and darkened edges.
   On phones the ship sits in the center; on desktop, to the right of the text.
   ========================================================================== */
window.Storm = (() => {
  const canvas = byId('storm');
  if (!canvas || !canvas.getContext) return null;
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const C = { safety: css.getPropertyValue('--brand').trim(), helmet: css.getPropertyValue('--focus').trim(), rust: css.getPropertyValue('--rust').trim() };
  const desktop = window.matchMedia('(min-width: 1024px)');
  const rand = (a, b) => a + Math.random() * (b - a);
  let w = 0, h = 0, t = 2.2, last = 0, running = false, visible = true, paused = false;
  let ship = { x: 0, y: 0, s: 1, roll: 0 };              // current ship position (for spray and smoke)

  // Particles: rain (z = depth: 0 far, 1 near), clouds, spray and smoke.
  const drops = Array.from({ length: 520 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }));
  const clouds = Array.from({ length: 22 }, (_, i) => ({ x: Math.random() * 1.4, y: rand(-0.05, 0.42), r: rand(0.12, 0.3), v: rand(0.006, 0.02) * (i % 3 + 1), d: rand(0.35, 0.75) }));
  const veils = Array.from({ length: 4 }, (_, i) => ({ x: i / 4, v: rand(0.03, 0.06), wd: rand(0.12, 0.25) }));
  let spray = [], smoke = [];

  function size() {
    const r = canvas.getBoundingClientRect();
    const d = Math.min(1.5, window.devicePixelRatio || 1);   // sharpness cap: keeps the drawing light
    w = r.width; h = r.height;
    canvas.width = Math.round(w * d); canvas.height = Math.round(h * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  // Wind: slant of the rain and of the flame, with slow gusts.
  const wind = () => 0.42 + Math.sin(t * 0.37) * 0.12 + Math.max(0, Math.sin(t * 0.91)) * 0.18;
  // Sea height at a point x, per layer (0 = horizon, 3 = nearest).
  const horizon = () => h * (desktop.matches ? 0.58 : 0.62);
  function sea(x, layer) {
    const u = x / w, a = h * (0.012 + layer * layer * 0.01);
    return horizon() + layer * h * (0.03 + layer * 0.01)
      + Math.sin(u * (6 + layer * 2) + t * (0.7 + layer * 0.35) + layer * 1.7) * a
      + Math.sin(u * (17 + layer * 5) - t * (1.3 + layer * 0.2)) * a * 0.45
      + Math.sin(u * 41 + t * 2.1 + layer) * a * 0.15;
  }

  function glow(x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1;
  }

  /* ----- 1. Sky ----- */
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, horizon());
    g.addColorStop(0, '#070c11'); g.addColorStop(0.55, '#16222c'); g.addColorStop(1, '#2c3c48');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // Orange glow of the flame reflected on the cloud base
    glow(ship.x + 330 * ship.s, horizon() - 300 * ship.s, 420 * ship.s, '#7a4a2a', 0.35);
    // Cloud masses: half light (lit edges), half dark (heavy cores),
    // drifting at different speeds.
    clouds.forEach((c, i) => {
      const cx = ((c.x + t * c.v * 0.1) % 1.4 - 0.2) * w, cy = c.y * h, r = c.r * Math.max(w, h);
      const lit = i % 2 === 0;
      const rgb = lit ? '72,90,104' : '5,9,13';
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      cg.addColorStop(0, `rgba(${rgb},${lit ? c.d * 0.7 : c.d})`); cg.addColorStop(0.55, `rgba(${rgb},${lit ? c.d * 0.25 : c.d * 0.55})`); cg.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = cg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    });
    // Mist hugging the horizon
    const mist = ctx.createLinearGradient(0, horizon() - h * 0.12, 0, horizon());
    mist.addColorStop(0, 'rgba(60,76,88,0)'); mist.addColorStop(1, 'rgba(60,76,88,.35)');
    ctx.fillStyle = mist; ctx.fillRect(0, horizon() - h * 0.12, w, h * 0.12);
  }

  /* ----- 2. Distant platform ----- */
  function drawFarRig() {
    const x = w * (desktop.matches ? 0.38 : 0.12), y = horizon() + 2, k = ship.s * 0.32;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#1e2a33';
    ctx.fillRect(-90, -70, 22, 70); ctx.fillRect(68, -70, 22, 70);         // columns
    ctx.fillRect(-110, -110, 220, 40);                                       // deck
    ctx.beginPath(); ctx.moveTo(-20, -110); ctx.lineTo(0, -230); ctx.lineTo(20, -110); ctx.closePath(); ctx.fill();   // tower
    ctx.restore();
    ctx.fillStyle = C.helmet;
    for (const [lx, ly] of [[-80, -96], [-30, -96], [40, -96], [90, -96]]) ctx.fillRect(x + lx * k, y + ly * k, 2, 2);
    ctx.fillStyle = '#ff6b5a'; ctx.fillRect(x - 1, y - 232 * k, 3, 3);         // top light (steady, does not blink)
  }

  /* ----- 3. Background sea ----- */
  function seaLayer(layer, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, sea(x, layer));
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  function foam(layer, alpha) {
    ctx.strokeStyle = `rgba(206,218,226,${alpha})`; ctx.lineWidth = 1.2 + layer * 0.6; ctx.beginPath();
    // Continuous foam only on the crests (where the wave is higher than its surroundings)
    let on = false;
    for (let x = 0; x <= w; x += 6) {
      const y = sea(x, layer), crest = y < sea(x - 40, layer) - 2 && y < sea(x + 40, layer) - 2;
      if (crest) { if (!on) ctx.moveTo(x, y); else ctx.lineTo(x, y - 1); }
      on = crest;
    }
    ctx.stroke();
  }

  /* ----- 4. FPSO ----- */
  function drawFPSO() {
    const big = desktop.matches;
    const s = big ? Math.min(w * 0.4 / 820, h / 760) : Math.min(w / 1000, h / 620);
    const cx = big ? w * 0.72 : w * 0.5;
    const roll = Math.sin(t * 0.7) * 0.03 + Math.sin(t * 1.3) * 0.008;     // heavy roll
    const base = sea(cx, 1) + 10 * s;
    ship = { x: cx, y: base, s, roll };
    ctx.save(); ctx.translate(cx, base); ctx.rotate(roll); ctx.scale(s, s);

    // Mooring lines and risers leaving the turret (they disappear into the sea)
    ctx.strokeStyle = '#33424e'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (const [dx, cx2] of [[0, 120], [10, 200], [-8, 60]]) { ctx.moveTo(250 + dx, 0); ctx.quadraticCurveTo(250 + cx2, 80, 300 + cx2, 220); }
    ctx.stroke();

    // Hull: bow on the right, higher
    ctx.fillStyle = '#2c3a45';
    ctx.beginPath(); ctx.moveTo(-405, -50); ctx.lineTo(330, -50); ctx.lineTo(412, -78); ctx.lineTo(392, 40); ctx.lineTo(-392, 40); ctx.lineTo(-410, -44); ctx.closePath(); ctx.fill();
    // Hull plating
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = -380; x < 380; x += 38) { ctx.moveTo(x, -48); ctx.lineTo(x, 38); }
    ctx.moveTo(-400, -20); ctx.lineTo(395, -20); ctx.stroke();
    ctx.strokeStyle = '#4a5966'; ctx.lineWidth = 2; ctx.beginPath();              // deck edge
    ctx.moveTo(-405, -50); ctx.lineTo(330, -50); ctx.lineTo(412, -78); ctx.stroke();
    // Rust streaks
    ctx.strokeStyle = C.rust; ctx.globalAlpha = 0.35; ctx.lineWidth = 3; ctx.beginPath();
    for (const x of [-330, -250, -170, -60, 40, 130, 220, 300]) { ctx.moveTo(x, -48); ctx.lineTo(x + 2, -48 + 20 + (x * 7 % 25 + 25) % 25); }
    ctx.stroke(); ctx.globalAlpha = 1;
    // Rust band at the waterline and the ship's name
    ctx.fillStyle = C.rust; ctx.fillRect(-392, 14, 784, 12);
    ctx.fillStyle = '#4a5966'; ctx.font = '800 20px "Big Shoulders Stencil Display", Impact, sans-serif';
    ctx.textAlign = 'right'; ctx.fillText('COMANDANTE ANCUNÍN', 385, -26); ctx.textAlign = 'left';
    // Deck guardrail
    ctx.strokeStyle = '#3c4c58'; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(-270, -60); ctx.lineTo(330, -60);
    for (let x = -270; x <= 330; x += 20) { ctx.moveTo(x, -50); ctx.lineTo(x, -60); }
    ctx.stroke();

    // Process modules, with grating levels and piping
    const modules = [[-262, 74, 58], [-180, 66, 82], [-106, 76, 54], [-22, 70, 96], [56, 84, 66], [148, 62, 76], [218, 50, 50]];
    for (const [x, wd, ht] of modules) {
      ctx.fillStyle = '#26333d'; ctx.fillRect(x, -50 - ht, wd, ht);
      ctx.strokeStyle = '#33424e'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let y = -50 - 18; y > -50 - ht; y -= 18) { ctx.moveTo(x, y); ctx.lineTo(x + wd, y); }
      ctx.moveTo(x + wd * 0.5, -50); ctx.lineTo(x + wd * 0.5, -50 - ht);
      ctx.stroke();
    }
    // Vertical vessels and exhaust stacks
    ctx.fillStyle = '#2d3b46';
    for (const [x, ht] of [[-150, 120], [-2, 140], [86, 108], [176, 112]]) ctx.fillRect(x, -50 - ht, 10, ht);
    // Pipe racks along the deck
    ctx.strokeStyle = '#43535f'; ctx.lineWidth = 3; ctx.beginPath();
    for (const y of [-74, -82, -104]) { ctx.moveTo(-268, y); ctx.lineTo(268, y); }
    ctx.stroke();

    // Accommodation at the stern, bridge, helideck and lifeboats
    ctx.fillStyle = '#2b3944'; ctx.fillRect(-392, -178, 112, 128);
    ctx.fillStyle = '#32424e'; ctx.fillRect(-398, -196, 124, 18);
    ctx.fillStyle = C.helmet;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) if ((r * 5 + c * 3) % 4) ctx.fillRect(-382 + c * 14, -166 + r * 18, 6, 8);
    ctx.fillRect(-394, -192, 116, 5);                                          // bridge windows
    ctx.strokeStyle = '#3c4c58'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(-420, -214); ctx.lineTo(-300, -214);                            // helideck
    ctx.moveTo(-410, -214); ctx.lineTo(-392, -196); ctx.moveTo(-310, -214); ctx.lineTo(-300, -196);
    ctx.moveTo(-330, -196); ctx.lineTo(-330, -250);                            // mast
    ctx.stroke();
    ctx.fillStyle = '#3c4c58'; ctx.fillRect(-424, -220, 128, 7);
    ctx.fillStyle = C.helmet; ctx.font = '800 12px sans-serif'; ctx.fillText('H', -366, -222);
    ctx.fillStyle = '#ff6b5a'; ctx.fillRect(-333, -254, 6, 6);                 // navigation light (steady)
    ctx.fillStyle = C.safety;
    for (const x of [-276, -248]) { ctx.beginPath(); ctx.roundRect(x, -92, 24, 13, 6); ctx.fill(); }

    // Lattice-boom cranes with cables
    ctx.strokeStyle = C.rust; ctx.lineWidth = 4;
    for (const [bx, tx, ty] of [[-60, 50, -210], [118, 20, -250]]) {
      ctx.beginPath(); ctx.moveTo(bx, -126); ctx.lineTo(bx, -170); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 1; i < 6; i++) { const k = i / 6; ctx.moveTo(bx + (tx - bx) * k, -170 + (ty + 170) * k); ctx.lineTo(bx + (tx - bx) * (k + 0.08), -170 + (ty + 170) * (k + 0.08) + 10); }
      ctx.stroke(); ctx.lineWidth = 4;
      ctx.strokeStyle = '#8c98a2'; ctx.lineWidth = 1;                         // cable swaying in the wind
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - 6 - Math.sin(t * 1.7) * 6, ty + 60); ctx.stroke();
      ctx.strokeStyle = C.rust; ctx.lineWidth = 4;
    }

    // Flare tower at the bow, with lattice and slanted boom
    ctx.strokeStyle = '#4a5966'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(300, -52); ctx.lineTo(332, -300); ctx.moveTo(346, -56); ctx.lineTo(342, -300);
    for (let y = -76; y > -290; y -= 28) { ctx.moveTo(302 + (-52 - y) * 0.13, y); ctx.lineTo(345, y - 20); }
    ctx.stroke();
    ctx.restore();

    // Deck floodlights with light cones in the rain
    for (const x of [-220, -40, 120]) {
      const lx = cx + x * s, ly = base - 140 * s;
      const cone = ctx.createLinearGradient(lx, ly, lx, base);
      cone.addColorStop(0, 'rgba(255,210,63,.16)'); cone.addColorStop(1, 'rgba(255,210,63,0)');
      ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(lx - 4 * s, ly); ctx.lineTo(lx + 4 * s, ly); ctx.lineTo(lx + 60 * s, base); ctx.lineTo(lx - 60 * s, base); ctx.closePath(); ctx.fill();
      glow(lx, ly, 50 * s, C.helmet, 0.3);
    }

    // Flare flame, bent by the wind (outside the roll, so the glow does not rotate)
    const fx = cx + (337 * Math.cos(roll) + 302 * Math.sin(roll)) * s;
    const fy = base + (337 * Math.sin(roll) - 302 * Math.cos(roll)) * s;
    const flick = 1 + Math.sin(t * 7) * 0.08 + Math.sin(t * 11.3) * 0.05;
    const bend = wind() * 60;
    glow(fx - bend * 0.4 * s, fy - 30 * s, 190 * s, C.safety, 0.4);
    ctx.save(); ctx.translate(fx, fy); ctx.scale(s, s * flick);
    ctx.fillStyle = C.safety;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.bezierCurveTo(-36, -20, -20 - bend * 0.5, -60, -bend, -100); ctx.bezierCurveTo(-bend * 0.4, -60, 30, -40, 14, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.helmet;
    ctx.beginPath(); ctx.moveTo(-2, -2); ctx.bezierCurveTo(-14, -16, -8 - bend * 0.3, -36, -bend * 0.55, -56); ctx.bezierCurveTo(-bend * 0.2, -36, 14, -26, 8, -6); ctx.closePath(); ctx.fill();
    ctx.restore();
    // Smoke rising from the flame, carried by the wind
    if (running && Math.random() < 0.35) smoke.push({ x: fx - bend * s, y: fy - 100 * s, r: 6 * s, life: 1 });
    ctx.fillStyle = '#26313a';
    for (const p of smoke) { ctx.globalAlpha = p.life * 0.25; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  /* ----- 5. Foreground waves and spray ----- */
  function drawFront() {
    seaLayer(2, '#14212b'); foam(2, 0.3);
    seaLayer(3, '#0d1820'); foam(3, 0.36);
    // Wave hitting the bow: spray every now and then
    const bowX = ship.x + 400 * ship.s;
    if (running && Math.sin(t * 1.4) > 0.75) {
      for (let i = 0; i < (desktop.matches ? 6 : 3); i++) spray.push({ x: bowX + rand(-40, 20) * ship.s, y: sea(bowX, 2), vx: rand(-90, -20) * ship.s, vy: rand(-220, -110) * ship.s, life: 1 });
    }
    ctx.fillStyle = '#d4dee5';
    for (const p of spray) { ctx.globalAlpha = p.life * 0.5; ctx.beginPath(); ctx.arc(p.x, p.y, (1.6 + p.life * 1.4) * Math.min(1, ship.s * 1.4), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  /* ----- 6 and 7. Rain, rain curtains and edges ----- */
  function drawRain() {
    const k = wind();
    for (const [from, to, alpha, width] of [[0, 0.45, 0.16, 1], [0.45, 0.8, 0.24, 1.2], [0.8, 1.01, 0.32, 1.6]]) {
      ctx.strokeStyle = `rgba(206,218,226,${alpha})`; ctx.lineWidth = width; ctx.beginPath();
      for (const d of drops) {
        if (d.z < from || d.z >= to) continue;
        const sp = 0.5 + d.z * 0.9, len = (10 + d.z * 26);
        const x = (((d.x - t * 0.18 * sp * k) % 1) + 1) % 1 * (w + 200) - 100, y = ((d.y + t * 0.75 * sp) % 1) * (h + 40) - 20;
        ctx.moveTo(x, y); ctx.lineTo(x - len * k, y + len);
      }
      ctx.stroke();
    }
    for (const v of veils) {
      const x = ((v.x - t * v.v) % 1.3 + 1.3) % 1.3 * w - 0.15 * w, wd = v.wd * w;
      const g = ctx.createLinearGradient(x, 0, x + wd, 0);
      g.addColorStop(0, 'rgba(150,165,175,0)'); g.addColorStop(0.5, 'rgba(150,165,175,.06)'); g.addColorStop(1, 'rgba(150,165,175,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + h * 0.4, 0); ctx.lineTo(x + h * 0.4 + wd, 0); ctx.lineTo(x + wd, h); ctx.lineTo(x, h); ctx.closePath(); ctx.fill();
    }
    const vg = ctx.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.3, w / 2, h * 0.45, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(5,9,13,0)'); vg.addColorStop(1, 'rgba(5,9,13,.6)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  // Simple physics for the spray and the smoke.
  function step(dt) {
    for (const p of spray) { p.vy += 380 * ship.s * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 0.9; }
    for (const p of smoke) { p.x -= wind() * 70 * ship.s * dt; p.y -= 18 * ship.s * dt; p.r += 10 * ship.s * dt; p.life -= dt * 0.35; }
    spray = spray.filter(p => p.life > 0).slice(-160);
    smoke = smoke.filter(p => p.life > 0).slice(-90);
  }

  function frame() {
    if (!w || !h) return;
    drawSky(); drawFarRig();
    seaLayer(0, '#22303b'); foam(0, 0.14);
    seaLayer(1, '#1a2731'); foam(1, 0.2);
    drawFPSO(); drawFront(); drawRain();
  }
  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    t += dt; step(dt);
    frame();
    requestAnimationFrame(loop);
  }
  function start() {
    if (running || paused || !Motion.allowed() || !visible || document.hidden) return;
    running = true; last = performance.now(); requestAnimationFrame(loop);
  }
  function stop() { running = false; }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  Motion.onChange(ok => { if (ok) start(); else { stop(); frame(); } });
  window.addEventListener('resize', () => { size(); frame(); });
  if (document.fonts) document.fonts.ready.then(frame);                    // redraws the ship's name with the right font
  size(); frame(); start();
  return {
    pause() { paused = true; stop(); },
    resume() { paused = false; size(); frame(); start(); }
  };
})();
/* ==========================================================================
   END: 9. FPSO IN THE STORM SCENE
   ========================================================================== */


/* ==========================================================================
   START: 10. SOUNDTRACK AND THUNDER (synthesized in the browser, no files)
   The game starts with the music on. Browsers only allow sound after
   the first tap or key press, so it comes in at that moment. The
   "Music" button at the top of the page turns it off at any time
   (WCAG 1.4.2). Pauses when the tab is hidden.
   Dramatic mood in A minor, 72 beats per minute:
   - deep drums with an audible attack (they come through even on laptop speakers);
   - bass pulsing in eighth notes, doubled an octave above;
   - synthesized strings in the mid range (Am, F, Dm, E);
   - filtered rain and thunder at irregular intervals.
   The thunder is sound only: there is no flash on screen (WCAG 2.3.1).
   ========================================================================== */
const Music = (() => {
  const button = byId('music-toggle');
  const state = byId('music-state');
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const BPM = 72, EIGHTH = 60 / BPM / 2;
  // Each chord lasts 2 bars (16 eighth notes): string notes and bass note.
  const PROGRESSION = [
    { strings: [220.00, 261.63, 329.63], bass: 55.00 },   // A minor
    { strings: [174.61, 220.00, 261.63], bass: 43.65 },   // F major
    { strings: [146.83, 174.61, 220.00], bass: 36.71 },   // D minor
    { strings: [164.81, 207.65, 246.94], bass: 41.20 }    // E major (tension)
  ];
  const DRUMS = [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 1];   // 2-bar pattern
  let ac = null, master = null, bus = null, noise = null, strings = [], on = false;
  let step = 0, nextTime = 0, scheduler = 0, thunderTimer = 0;

  function noiseBuffer(seconds) {
    const buf = ac.createBuffer(1, ac.sampleRate * seconds, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function build() {
    ac = new AudioCtx();
    // Compressor at the end of the chain: makes everything louder and fuller without distortion.
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 4; comp.attack.value = 0.01; comp.release.value = 0.25;
    master = ac.createGain(); master.gain.value = 0;
    bus = ac.createGain(); bus.gain.value = 1;
    bus.connect(comp).connect(master).connect(ac.destination);
    noise = noiseBuffer(3);

    // Rain: continuous noise with an oscillating filter (wind).
    const rain = ac.createBufferSource(); rain.buffer = noise; rain.loop = true;
    const band = ac.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 1400; band.Q.value = 0.5;
    const wind = ac.createOscillator(); wind.frequency.value = 0.08;
    const windDepth = ac.createGain(); windDepth.gain.value = 500;
    wind.connect(windDepth).connect(band.frequency);
    const rainGain = ac.createGain(); rainGain.gain.value = 0.16;
    rain.connect(band).connect(rainGain).connect(bus);
    rain.start(); wind.start();

    // Strings: two detuned sawtooth waves per note, with light vibrato.
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; lp.Q.value = 0.5;
    const stringGain = ac.createGain(); stringGain.gain.value = 0.22;
    lp.connect(stringGain).connect(bus);
    const vibrato = ac.createOscillator(); vibrato.frequency.value = 5;
    const vibDepth = ac.createGain(); vibDepth.gain.value = 4;
    vibrato.connect(vibDepth); vibrato.start();
    for (let n = 0; n < 3; n++) for (const detune of [-9, 9]) {
      const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.detune.value = detune;
      vibDepth.connect(osc.detune);
      const g = ac.createGain(); g.gain.value = 0.11;
      osc.frequency.value = PROGRESSION[0].strings[n];
      osc.connect(g).connect(lp); osc.start();
      strings.push({ osc, note: n });
    }
  }

  // Drum: a tone falling from 140 Hz to 45 Hz + a short noise click on the attack.
  function drum(time, accent) {
    const osc = ac.createOscillator(); const g = ac.createGain();
    osc.frequency.setValueAtTime(140, time); osc.frequency.exponentialRampToValueAtTime(45, time + 0.35);
    g.gain.setValueAtTime(accent ? 1 : 0.7, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.7);
    osc.connect(g).connect(bus); osc.start(time); osc.stop(time + 0.75);
    const click = ac.createBufferSource(); click.buffer = noise;
    const hp = ac.createBiquadFilter(); hp.type = 'lowpass'; hp.frequency.value = 2500;
    const cg = ac.createGain(); cg.gain.setValueAtTime(0.35, time); cg.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    click.connect(hp).connect(cg).connect(bus); click.start(time, Math.random()); click.stop(time + 0.08);
  }
  // Bass in eighth notes, doubled an octave above so it comes through on small speakers.
  function bass(time, freq) {
    for (const [mult, vol] of [[1, 0.35], [2, 0.22]]) {
      const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = freq * mult;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      const g = ac.createGain();
      g.gain.setValueAtTime(vol, time); g.gain.exponentialRampToValueAtTime(0.001, time + EIGHTH * 0.9);
      osc.connect(f).connect(g).connect(bus); osc.start(time); osc.stop(time + EIGHTH);
    }
  }
  // Thunder: an initial crack and a long rumble that grows darker.
  function thunder() {
    if (!on) return;
    // Sound still blocked by the browser: do not queue up thunder for later.
    if (ac.state !== 'running') { thunderTimer = setTimeout(thunder, 3000); return; }
    const time = ac.currentTime + 0.05;
    const src = ac.createBufferSource(); src.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(2200, time); f.frequency.exponentialRampToValueAtTime(120, time + 3.5);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, time); g.gain.exponentialRampToValueAtTime(1.4, time + 0.08);
    g.gain.exponentialRampToValueAtTime(0.5, time + 0.9); g.gain.exponentialRampToValueAtTime(0.001, time + 5);
    src.connect(f).connect(g).connect(bus); src.start(time, Math.random()); src.stop(time + 5);
    // Extra low rumble
    const rumble = ac.createOscillator(); rumble.frequency.value = 38;
    const rg = ac.createGain(); rg.gain.setValueAtTime(0.0001, time); rg.gain.exponentialRampToValueAtTime(0.6, time + 0.3); rg.gain.exponentialRampToValueAtTime(0.001, time + 4);
    rumble.connect(rg).connect(bus); rumble.start(time); rumble.stop(time + 4.2);
    thunderTimer = setTimeout(thunder, 9000 + Math.random() * 14000);   // next one in 9 to 23 s
  }

  // Schedules notes slightly ahead of the current time (no audible delays).
  function schedule() {
    while (nextTime < ac.currentTime + 0.2) {
      const chord = PROGRESSION[Math.floor(step / 16) % PROGRESSION.length];
      const inBar = step % 16;
      if (inBar === 0) strings.forEach(v => v.osc.frequency.setTargetAtTime(chord.strings[v.note], nextTime, 0.25));
      if (DRUMS[inBar]) drum(nextTime, inBar === 0 || inBar === 8);
      bass(nextTime, inBar % 4 === 3 ? chord.bass * 1.5 : chord.bass);   // fifth at the end of each strong beat
      nextTime += EIGHTH; step++;
    }
  }

  // Gentle entry: the volume rises from silence to full level in 1 second,
  // on a curve that grows slowly at first (the ear perceives it as gradual).
  const FADE_IN = 1;
  // Volume chosen on the slider (0 to 100%). At 100% the gain is 1.1; the
  // output compressor holds back the peaks.
  const volume = byId('music-volume'), volumeText = byId('music-volume-value');
  let level = Number(volume.value) / 100;
  const target = () => Math.max(0.0001, level * 1.1);
  function fadeIn() {
    const now = ac.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(target(), now + FADE_IN);
  }
  volume.addEventListener('input', () => {
    level = Number(volume.value) / 100;
    volumeText.textContent = volume.value + '%';
    volume.setAttribute('aria-valuetext', volume.value + '%');
    if (ac && on) {                                                    // changes quickly, without a click
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setTargetAtTime(target(), ac.currentTime, 0.05);
    }
  });

  function setOn(value) {
    on = value;
    button.setAttribute('aria-pressed', String(on));
    state.textContent = on ? 'on' : 'off';
    if (on) {
      if (!ac) { if (!AudioCtx) { announce('This browser cannot play the soundtrack.'); on = false; button.setAttribute('aria-pressed', 'false'); state.textContent = 'off'; return; } build(); }
      ac.resume();
      fadeIn();
      nextTime = ac.currentTime + 0.1; step = 0;
      scheduler = setInterval(schedule, 50);
      thunderTimer = setTimeout(thunder, 2500);                       // first thunder right at the start
    } else if (ac) {
      clearInterval(scheduler); clearTimeout(thunderTimer);
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setTargetAtTime(0, ac.currentTime, 0.25);           // fades out slowly
      setTimeout(() => { if (!on) ac.suspend(); }, 1200);
    }
  }
  // On but still blocked by the browser: clicking the button unlocks the
  // sound instead of turning it off (the player has not heard anything yet).
  const blocked = () => on && ac && ac.state !== 'running';
  button.addEventListener('click', () => {
    if (blocked()) { ac.resume().then(fadeIn); announce('Music on.'); return; }
    setOn(!on); announce(on ? 'Music on.' : 'Music off.');
  });

  // First tap or key press anywhere on the page: unlocks the sound.
  function unlock(e) {
    if (e.target.closest && e.target.closest('#music-toggle')) return;
    if (blocked() && !document.hidden) ac.resume().then(fadeIn);
    if (!ac || ac.state === 'running' || !on) {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
    }
  }
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
  setOn(true);                                                         // starts on
  document.addEventListener('visibilitychange', () => {
    if (!ac || !on) return;
    if (document.hidden) ac.suspend(); else ac.resume();
  });
  return { stop: () => setOn(false) };
})();
/* ==========================================================================
   END: 10. SOUNDTRACK AND THUNDER
   ========================================================================== */


/* ==========================================================================
   START: 11. PHASE MENU AND PROGRESS
   The list of phases comes from PHASES. The first phase not yet completed
   is the recommended one (orange). The others are gray, with no label:
   the fixed notice above the list explains that playing out of order is
   not advisable.
   Locked phases show only their number, so as not to spoil the storyline.
   Phases listed in js/release.js (OC_RELEASE.locked) are closed to the
   public: they show "Coming soon" and cannot be opened. The public
   preview locks every phase; the development version locks none.
   ========================================================================== */
const PHASES = [
  { id: 'fase1', num: '01', name: 'Introduction', ready: true, href: 'intro.html' },
  { id: 'fase2', num: '02', name: '', ready: true }
];

const RELEASE = window.OC_RELEASE || { locked: [] };   // no js/release.js: nothing locked
const LOCKED = new Set(RELEASE.locked || []);
const isLocked = phase => LOCKED.has(phase.id);

window.Phases = (() => {
  const menu = byId('phase-menu');
  const list = byId('phase-list');
  const notice = byId('phase-notice');
  const wipBox = byId('phase-wip');
  const note = byId('progress-note');
  let done = new Set();

  function load() {
    try { done = new Set(JSON.parse(Store.get('oc-progress') || '[]')); } catch (e) { done = new Set(); }
  }
  function save() { Store.set('oc-progress', JSON.stringify(Array.from(done))); }
  const open_ = PHASES.filter(p => !isLocked(p));
  const recommended = () => open_.find(p => !done.has(p.id)) || open_[open_.length - 1];

  function render() {
    const rec = recommended();
    list.textContent = '';
    PHASES.forEach(phase => {
      const isDone = done.has(phase.id);
      const isNext = phase === rec && !isDone;
      const locked = isLocked(phase);
      const state = locked ? 'locked' : isDone ? 'done' : isNext ? 'next' : 'skip';
      const revealed = !locked && (isDone || isNext);  // future phases do not show their name
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'oc-phasebtn';
      btn.dataset.state = state;
      btn.innerHTML =
        '<span class="oc-phasebtn__num" aria-hidden="true">' + phase.num + '</span>' +
        '<span class="oc-phasebtn__name">Phase ' + Number(phase.num) + (revealed ? ': ' + phase.name : '') + '</span>' +
        (locked
          ? '<span class="oc-phasebtn__status">Coming soon</span>'
          : isDone || isNext
            ? '<span class="oc-phasebtn__status">' + (isDone ? '✓ Completed · play again' : '▶ Start here') + '</span>'
            : '');
      btn.addEventListener('click', () => play(phase));
      li.append(btn);
      if (phase.href === 'intro.html') {
        const availability = document.createElement('p');
        availability.className = 'oc-phase-availability';
        availability.id = 'phase-01-availability';
        availability.textContent = 'This phase is not playable yet. Only part of the introduction is currently available.';
        btn.setAttribute('aria-describedby', availability.id);
        li.append(availability);
      }
      list.append(li);
    });
    const consent = Store.consent();
    note.textContent = consent === 'yes'
      ? 'Your progress is saved in this browser.'
      : 'Your progress is not being saved. You can change this in "Privacy and progress".';
  }

  function showList() {
    wipBox.hidden = true; list.hidden = false; notice.hidden = false;
  }
  function play(phase) {
    if (phase.href && !isLocked(phase)) { window.location.assign(phase.href); return; }
    if (isLocked(phase) || !phase.ready) {
      list.hidden = true; notice.hidden = true; wipBox.hidden = false;
      byId('phase-wip-title').textContent = 'Phase ' + Number(phase.num) + (isLocked(phase) ? ' · Coming soon' : ' under construction');
      byId('phase-wip-text').textContent = isLocked(phase)
        ? 'This phase is not open to the public yet. It will be released here as soon as it is ready.'
        : 'This phase is still being prepared. Go back to the menu to choose another one.';
      byId('phase-wip-back').focus();
      return;
    }
    menu.close();
    enterGame();
  }

  // Public preview (every phase locked): the order notice gives way to a preview notice.
  if (open_.length === 0) {
    notice.querySelector('p').textContent = 'Public preview: the phases are still being built and will open here as soon as they are ready.';
  }

  byId('phase-wip-back').addEventListener('click', () => { showList(); list.querySelector('button').focus(); });
  byId('phase-menu-close').addEventListener('click', () => menu.close());
  menu.addEventListener('close', showList);

  function open() {
    render(); showList();
    if (typeof menu.showModal === 'function') menu.showModal(); else menu.setAttribute('open', '');
    list.querySelector('[data-state="next"], button').focus();
  }
  byId('start-game').addEventListener('click', open);
  const openPhases = byId('open-phases');            // missing in the public preview build
  if (openPhases) openPhases.addEventListener('click', () => { leaveGame(); open(); });

  load();
  return {
    open,
    complete(id) {
      if (done.has(id)) return;
      done.add(id); save();
      announce('Phase complete. ' + (Store.consent() === 'yes' ? 'Progress saved in this browser.' : 'Progress not saved.'));
    },
    persist() { save(); },
    eraseMemory() { done = new Set(); }
  };
})();
/* ==========================================================================
   END: 11. PHASE MENU AND PROGRESS
   ========================================================================== */


/* ==========================================================================
   START: 12. PRIVACY NOTICE (LGPD, Brazil's General Data Protection Law,
   Law No. 13,709/2018)
   Appears on the first visit, without blocking the page. "Save my
   progress" records consent and starts saving; "Don't save" records
   only the refusal (so it does not ask again). "Erase my progress" removes
   everything and asks again.
   ========================================================================== */
// Contact for privacy questions and complaints. When the address is
// filled in, the "Contact" line appears in the notice; when empty, it stays hidden.
const PRIVACY_CONTACT = 'ambuxedev@gmail.com';

(() => {
  const box = byId('privacy');
  if (PRIVACY_CONTACT) {
    byId('privacy-email').textContent = PRIVACY_CONTACT;
    byId('privacy-contact').hidden = false;
  }
  const accept = byId('privacy-accept');
  const decline = byId('privacy-decline');
  const erase = byId('privacy-erase');

  function show(focus) {
    erase.hidden = Store.consent() !== 'yes';
    box.hidden = false;
    if (focus) {
      const title = byId('privacy-title');
      title.setAttribute('tabindex', '-1');
      title.focus();
    }
  }
  function hide(returnTo) {
    box.hidden = true;
    if (returnTo) returnTo.focus();
  }
  accept.addEventListener('click', () => {
    Store.setConsent('yes');
    Phases.persist();                    // saves what was already completed during this visit
    hide(byId('start-game'));
    announce('Progress will be saved in this browser.');
  });
  decline.addEventListener('click', () => {
    Store.eraseAll(); Store.setConsent('no');
    hide(byId('start-game'));
    announce('Nothing will be saved. The game works normally.');
  });
  erase.addEventListener('click', () => {
    Store.eraseAll(); Store.setConsent('no');
    Phases.eraseMemory();
    erase.hidden = true;
    announce('Progress erased. Nothing else will be saved until you accept again.');
  });
  byId('privacy-open').addEventListener('click', () => { byId('phase-menu').close(); show(true); });

  if (Store.consent() === null) show(false);
})();
/* ==========================================================================
   END: 12. PRIVACY NOTICE
   ========================================================================== */


