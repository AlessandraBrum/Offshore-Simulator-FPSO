/* Decorative sea life. Geometry is sampled once, then reflows with the camera. */
(() => {
  'use strict';
  const scene = document.querySelector('.intro-scene');
  const ns = 'http://www.w3.org/2000/svg';
  function svg(tag, attributes, parent) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (parent) parent.appendChild(element);
    return element;
  }
  const rocks = svg('g', {'aria-hidden': 'true', id: 'sea-rocks'});
  const algae = svg('g', {'aria-hidden': 'true', id: 'sea-algae'});
  const fish = svg('g', {'aria-hidden': 'true', id: 'sea-life'});
  const pipe = scene.querySelector('use[href="#route"]');
  scene.insertBefore(rocks, pipe);
  scene.insertBefore(algae, pipe);
  scene.insertBefore(fish, pipe);
  const random = (min, max) => min + Math.random() * (max - min);
  const rockSamples = Array.from({length: 34}, (_, i) => ({
    position: (i + random(.1, .9)) / 34,
    depth: random(0, 1), width: random(28, 115), height: random(12, 85),
    peak: random(.25, .7), shoulder: random(.35, .7)
  }));
  // Modest, rooted clusters: variation is sampled once rather than on resize.
  const algaeSamples = Array.from({length: 11}, (_, i) => ({
    position: (i + random(.2, .8)) / 11, depth: random(.05, .9),
    height: random(20, 47), spread: random(7, 17),
    blades: Math.floor(random(3, 6)), bend: random(-9, 9),
    color: ['#287080', '#246171', '#337b83'][Math.floor(random(0, 3))]
  }));
  // Fish shapes (head on the right, tail on the left). The round, tall-bodied
  // one was removed at the author's request: only slim, elongated fish remain.
  const shapes = [
    'M-16 0Q0-15 19 0Q0 15-16 0L-28 10V-10Z',
    'M-20 0Q0-7 25 0Q0 8-20 0L-31 6V-6Z',
    'M-24 0Q-2-13 23 0Q2 13-24 0L-35 9V-9ZM-3-6 3-18 10-7Z'
  ];
  const fishSamples = Array.from({length: 24}, (_, i) => ({
    position: (i + random(.05, .95)) / 24, depth: random(315, 645),
    size: random(.18, i % 7 === 0 ? 1.45 : .65),
    shape: Math.floor(random(0, shapes.length)), direction: Math.random() < .5 ? -1 : 1,
    duration: random(20, 48), delay: random(-45, 0), travel: random(35, 130), bob: random(4, 15)
  }));
  function layout() {
    const box = scene.viewBox.baseVal;
    const left = box.x, width = box.width || 1200;
    const floorBottom = Math.max(780, Math.min(box.y + box.height, 1200));
    rocks.replaceChildren(); algae.replaceChildren(); fish.replaceChildren();
    rockSamples.forEach(sample => {
      const x = left + sample.position * width;
      const y = 720 + sample.depth * (floorBottom - 720);
      // Keep the subsea well and the first length of pipe readable.
      if (x > 185 && x < 340 && y < 755) return;
      const w = sample.width, h = sample.height;
      const group = svg('g', {transform: `translate(${x} ${y})`}, rocks);
      svg('path', {d: `M${-w/2} 0L${-w*.34} ${-h*sample.shoulder}L${w*(sample.peak-.5)} ${-h}L${w*.27} ${-h*.85}L${w/2} 0Z`, fill: sample.depth > .5 ? '#0b2838' : '#153e4e'}, group);
      svg('path', {d: `M${-w*.34} ${-h*sample.shoulder}L${w*(sample.peak-.5)} ${-h}L${w*.27} ${-h*.85}L${w*.05} ${-h*.5}Z`, fill: '#285161', opacity: '.6'}, group);
    });
    algaeSamples.forEach(sample => {
      const x = left + sample.position * width;
      const y = 724 + sample.depth * (floorBottom - 724);
      if (x > 195 && x < 315 && y < 760) return;
      const cluster = svg('g', {transform: `translate(${x} ${y})`, fill: 'none', stroke: sample.color, 'stroke-width': '2.4', 'stroke-linecap': 'round', opacity: '.85'}, algae);
      for (let blade = 0; blade < sample.blades; blade++) {
        const fraction = blade / (sample.blades - 1);
        const tip = (fraction - .5) * sample.spread * 2;
        const height = sample.height * (.7 + .3 * Math.sin(fraction * Math.PI));
        svg('path', {d: `M${(fraction-.5)*4} 0C${tip*.6} ${-height*.3} ${tip+sample.bend} ${-height*.65} ${tip} ${-height}`}, cluster);
      }
    });
    fishSamples.forEach(sample => {
      const group = svg('g', {transform: `translate(${left + sample.position * width} ${sample.depth})`, opacity: sample.size < .4 ? '.4' : '.7'}, fish);
      const swimmer = svg('g', {class: 'intro-fish intro-fish--varied', style: `--fish-travel:${sample.travel * sample.direction}px;--fish-bob:${sample.bob}px;animation-duration:${sample.duration}s;animation-delay:${sample.delay}s`}, group);
      const body = svg('g', {transform: `scale(${sample.size * sample.direction} ${sample.size})`}, swimmer);
      svg('path', {d: shapes[sample.shape], fill: sample.depth > 500 ? '#1c5362' : '#082e41'}, body);
      if (sample.size > .7) svg('circle', {cx: '12', cy: '-2', r: '1.1', fill: '#7ba0a8'}, body);
    });
  }
  // Bubbles rising along the riser (decorative; stopped with the other animations).
  const route = document.getElementById('route');
  if (route) {
    const bubbles = svg('g', {'aria-hidden': 'true', fill: 'none', stroke: '#a8d8e0', 'stroke-width': '1.2'});
    scene.insertBefore(bubbles, pipe);
    const total = route.getTotalLength();
    for (let i = 0; i < 22; i++) {
      const p = route.getPointAtLength(total * (i + random(.1, .9)) / 22);
      svg('circle', {class: 'intro-bubble', cx: (p.x + random(-14, 14)).toFixed(1), cy: (p.y - random(4, 20)).toFixed(1), r: random(1.5, 3.5).toFixed(1), style: `animation-delay:-${random(0, 9).toFixed(1)}s;animation-duration:${random(7, 12).toFixed(1)}s`}, bubbles);
    }
  }
  new MutationObserver(layout).observe(scene, {attributes: true, attributeFilter: ['viewBox']});
  layout();
})();



