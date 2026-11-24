/* Pantalla de inicio: Marian y Rey en el cielo. Al tocarlos, dan un saltito. */
(() => {
  'use strict';
  const NV = window.NV, A = NV.Art;
  const root = NV.$('home'), cv = NV.$('homeCv'), ctx = cv.getContext('2d');
  const HOP = 0.5;
  let fit = null, scene = null, clk = 0;
  const hop = { marian: 0, rey: 0 };

  function layout() {
    fit = NV.fitWorld(root, cv, ctx);
    scene = NV.Scene.make(0, fit.W, fit.H, fit.H * 0.5, false);
  }
  const lift = k => (hop[k] > 0 ? Math.sin((Math.PI * (HOP - hop[k])) / HOP) * 36 : 0);

  function spots() {
    const gy = scene.groundY;
    return {
      marian: { x: fit.W * 0.3, feet: gy - 96 + Math.sin(clk * 2.2) * 4 - lift('marian') },
      rey: { x: fit.W * 0.7, feet: gy - lift('rey') },
    };
  }

  function tick(dt) {
    if (!fit) return;
    clk += dt;
    for (const k in hop) if (hop[k] > 0) hop[k] = Math.max(0, hop[k] - dt);
    NV.Scene.draw(ctx, scene, { scroll: clk * 7, clk });
    const s = spots();
    const mSc = 1 - (lift('marian') / 36) * 0.3;
    const rSc = 1 - (lift('rey') / 36) * 0.35;
    ctx.fillStyle = 'rgba(60,40,20,0.16)';
    ctx.beginPath();
    ctx.ellipse(s.marian.x, scene.groundY + 2, 26 * mSc, 5 * mSc, 0, 0, Math.PI * 2);
    ctx.ellipse(s.rey.x, scene.groundY + 2, 24 * rSc, 5 * rSc, 0, 0, Math.PI * 2);
    ctx.fill();
    A.drawChar(ctx, 'rey', hop.rey > 0 ? 'open' : 'happy', s.rey.x, s.rey.feet);
    A.drawChar(ctx, 'marian', hop.marian > 0 ? 'open' : 'happy', s.marian.x, s.marian.feet);
  }

  cv.addEventListener('pointerdown', e => {
    if (!fit) return;
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / fit.s, y = (e.clientY - r.top) / fit.s;
    const s = spots();
    for (const k of ['marian', 'rey']) {
      const p = s[k];
      if (Math.abs(x - p.x) < 36 && y > p.feet - 66 && y < p.feet + 4 && hop[k] <= 0) {
        hop[k] = HOP;
        NV.Sound.pop();
      }
    }
  });

  NV.Home = { open: layout, close() {}, tick, resize: layout };
})();
