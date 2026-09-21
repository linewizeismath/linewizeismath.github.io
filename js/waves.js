/* ==========================================================================
   KRYPTON - flowing white waves (canvas background)
   ========================================================================== */
(() => {
  'use strict';

  const canvas = document.getElementById('waves');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const LINES = 28;   // number of wave lines
  const STEP = 8;     // horizontal resolution in px (higher = faster, rougher)
  const SPEED = 1;    // overall flow speed

  let w = 0, h = 0, dpr = 1;
  let fade = null;
  let raf = 0;
  let time = 0;
  let last = 0;

  // Each line gets its own frequency, speed and phase so they drift against each other.
  const waves = Array.from({ length: LINES }, (_, i) => {
    const p = i / (LINES - 1);
    const bell = Math.sin(p * Math.PI); // 0 at the edges, 1 in the middle
    return {
      p,
      amp1: 55 + bell * 95,
      amp2: 18 + bell * 30,
      f1: 0.0014 + p * 0.00018,
      f2: 0.0031 - p * 0.00030,
      s1: 0.46 + p * 0.06,
      s2: 0.30 + p * 0.05,
      phase1: p * 4.4,   // small phase steps keep neighbouring lines together, like ribbons
      phase2: p * 5.6,
      alpha: 0.16 + bell * 0.44
    };
  });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // soft fade at the left and right edges
    fade = ctx.createLinearGradient(0, 0, w, 0);
    fade.addColorStop(0, 'rgba(255,255,255,0)');
    fade.addColorStop(0.14, 'rgba(255,255,255,1)');
    fade.addColorStop(0.86, 'rgba(255,255,255,1)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');

    if (!raf) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.1;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = fade;

    const k = Math.min(Math.max(h / 900, 0.6), 1.4); // scale amplitude with screen height

    for (const wv of waves) {
      const baseY = h * (0.14 + wv.p * 0.72);
      ctx.globalAlpha = wv.alpha;
      ctx.beginPath();

      for (let x = -STEP; x <= w + STEP; x += STEP) {
        const swell = Math.sin(x * 0.0007 + time * 0.30 + wv.p * 1.2) * h * 0.09;
        const y =
          baseY + swell * 1 +
          Math.sin(x * wv.f1 + time * wv.s1 + wv.phase1) * wv.amp1 * k +
          Math.sin(x * wv.f2 - time * wv.s2 + wv.phase2) * wv.amp2 * k;

        if (x === -STEP) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function tick(now) {
    const dt = Math.min(now - last, 50);
    last = now;
    time += (dt / 1000) * SPEED;
    draw();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function applyMotionPreference() {
    if (reducedMotion.matches) {
      stop();
      time = 4;
      draw(); // one still frame
    } else {
      start();
    }
  }

  window.addEventListener('resize', resize);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', applyMotionPreference);

  resize();
  applyMotionPreference();
})();
