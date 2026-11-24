/* Núcleo compartido: utilidades, sonidos, récords y ayudas para las pantallas. */
(() => {
  'use strict';
  const NV = (window.NV = window.NV || {});

  NV.PX = 1.6; /* unidades del mundo por cada pixel del arte */
  NV.$ = id => document.getElementById(id);
  NV.rand = (a, b) => a + Math.random() * (b - a);
  NV.pick = a => a[(Math.random() * a.length) | 0];
  NV.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  NV.buzz = ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  NV.who = (() => {
    let n = 'bonita';
    try {
      const raw = decodeURIComponent(location.hash.slice(1)).replace(/-/g, ' ').trim();
      if (raw && /^[\p{L} ]{1,24}$/u.test(raw)) n = raw.charAt(0).toUpperCase() + raw.slice(1);
    } catch (e) {}
    return n;
  })();
  NV.fill = s => s.replace(/\{n\}/g, NV.who);
  NV.NAME = { marian: 'Marian', rey: 'Rey' };

  NV.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  NV.circleRect = (cx, cy, r, x, y, w, h) => {
    const nx = NV.clamp(cx, x, x + w), ny = NV.clamp(cy, y, y + h);
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  };
  NV.showPanel = (panels, name) => { for (const k in panels) panels[k].hidden = k !== name; };

  /* Ajusta el lienzo. El ancho del mundo siempre es 360 unidades o más;
     si la pantalla es alta, el mundo crece hacia arriba (no se estira nada). */
  NV.fitWorld = (root, cv, ctx) => {
    const r = root.getBoundingClientRect();
    const vw = Math.max(1, r.width), vh = Math.max(1, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    const s = Math.min(vw / 360, vh / 600);
    ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    ctx.imageSmoothingEnabled = false;
    return { vw, vh, s, W: vw / s, H: vh / s };
  };

  /* Corazones de la barra superior, con el mismo pixel art. */
  NV.hearts = (box, n) => {
    box.textContent = '';
    for (let i = 0; i < 3; i++) {
      const im = document.createElement('img');
      im.src = NV.Art.dataURL(NV.Art.heart());
      im.alt = '';
      im.style.opacity = i < n ? '1' : '0.25';
      box.appendChild(im);
    }
  };

  /* Récords: solo en este dispositivo. Toma los de la versión anterior si existen. */
  NV.Best = (() => {
    const KEY = 'nv-best';
    const num = v => (Number.isFinite(v) && v >= 0 ? Math.min(Math.floor(v), 1e9) : 0);
    const data = { cart: 0, feed: 0, fly: 0 };
    try {
      const old = JSON.parse(localStorage.getItem('pc-me') || 'null');
      if (old) {
        data.cart = num(old.cart);
        data.feed = num(Math.max(old.feed || 0, old.purin || 0, old.cinna || 0));
      }
    } catch (e) {}
    try {
      const now = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (now) for (const k in data) data[k] = Math.max(data[k], num(now[k]));
    } catch (e) {}
    return {
      get: k => data[k] || 0,
      offer(k, v) {
        v = num(v);
        if (v <= data[k]) return false;
        data[k] = v;
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
        return true;
      },
    };
  })();

  /* Sonidos suaves generados con el navegador (sin archivos). */
  NV.Sound = (() => {
    let ctx = null, master = null, on = true;
    try { on = localStorage.getItem('np-sound') !== 'off'; } catch (e) {}
    function ensure() {
      try {
        if (!ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          ctx = new AC();
          master = ctx.createGain();
          master.gain.value = 0.45;
          master.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') ctx.resume();
      } catch (e) { ctx = null; }
    }
    function tone(f0, f1, dur, type, vol, delay) {
      if (!on || !ctx) return;
      try {
        const t = ctx.currentTime + (delay || 0);
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + dur + 0.03);
      } catch (e) {}
    }
    return {
      ensure,
      get on() { return on; },
      set(v) { on = v; try { localStorage.setItem('np-sound', v ? 'on' : 'off'); } catch (e) {} },
      pop() { tone(620, 980, 0.12, 'sine', 0.18); },
      squeak() { tone(680, 1050, 0.09, 'triangle', 0.07); },
      boing() { tone(200, 540, 0.2, 'sine', 0.2); tone(540, 320, 0.2, 'sine', 0.1, 0.12); },
      thud() { tone(150, 60, 0.15, 'sine', 0.18); },
      whine() { tone(620, 900, 0.12, 'triangle', 0.06); tone(900, 640, 0.15, 'triangle', 0.06, 0.12); },
      nom() { tone(380, 300, 0.07, 'triangle', 0.09); tone(420, 320, 0.07, 'triangle', 0.09, 0.12); },
      chime() { tone(1320, 1320, 0.25, 'sine', 0.04); tone(1760, 1760, 0.3, 'sine', 0.03, 0.08); },
    };
  })();
})();
