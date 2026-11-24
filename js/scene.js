/* Escenarios pixel art: cielo con sol o luna, nubes, cerros con árboles, pasto o mar de nubes. */
(() => {
  'use strict';
  const NV = window.NV, PX = NV.PX;

  const BIOME = [
    {
      skyTop: '#9BD8F5', skyBot: '#FFF0D6', sun: '#FFF1A6', sunRim: '#FFD35C',
      far: '#BFE6B4', farEdge: '#A6D99C', near: '#93D186', nearEdge: '#74BC6C',
      tree: '#5DAA62', treeDark: '#3E7F47', trunk: '#7A4E2D',
      grass: '#8DCF7A', grassDark: '#6CB260', soil: '#D0A074', soilDark: '#A87A52', flower: '#FFB3C9',
      sea: '#FFFFFF', seaShade: '#D9E9FA', seaLine: '#AFD2F3',
      cloud: { body: '#FFFFFF', shade: '#D7E8FA', line: '#9CC3EA' }, night: false,
    },
    {
      skyTop: '#F5A18E', skyBot: '#FFE0B5', sun: '#FFD27A', sunRim: '#F7A74A',
      far: '#E7B49E', farEdge: '#D89C85', near: '#D9977E', nearEdge: '#BD7B66',
      tree: '#C98A5A', treeDark: '#9C6240', trunk: '#6B4330',
      grass: '#D9A06C', grassDark: '#B97E53', soil: '#B57A59', soilDark: '#8E5C42', flower: '#FFE08A',
      sea: '#FFF6EC', seaShade: '#F6D2BF', seaLine: '#E9A98F',
      cloud: { body: '#FFF4EC', shade: '#F6CDBE', line: '#D9978A' }, night: false,
    },
    {
      skyTop: '#1B2A52', skyBot: '#56699F', sun: '#F3EED0', sunRim: '#C9D2F5',
      far: '#34497F', farEdge: '#2C3E70', near: '#2A3C6E', nearEdge: '#22345F',
      tree: '#3B5C8E', treeDark: '#2C4673', trunk: '#1F2D57',
      grass: '#3F5A9A', grassDark: '#33497F', soil: '#2B3C6B', soilDark: '#1F2D57', flower: '#CDB8FF',
      sea: '#8D9BD0', seaShade: '#6F7FB9', seaLine: '#5B68A3',
      cloud: { body: '#8EA0DA', shade: '#6F80C0', line: '#4D5C9A' }, night: true,
    },
  ];

  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';
  const seeded = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

  function pdisc(g, cx, cy, r, col) {
    g.fillStyle = col;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) g.fillRect(x, y, 1, 1);
      }
    }
  }

  function buildSky(bi, AW, AH) {
    const P = BIOME[bi], c = NV.mk(AW, AH), g = c.getContext('2d');
    const top = rgb(P.skyTop), bot = rgb(P.skyBot), BANDS = 6;
    for (let y = 0; y < AH; y++) {
      const q = Math.min(BANDS - 1, Math.floor((y / AH) * BANDS)) / (BANDS - 1);
      g.fillStyle = mix(top, bot, q);
      g.fillRect(0, y, AW, 1);
    }
    const sx = Math.round(AW * 0.8), sy = Math.round(AH * 0.2), R = Math.max(5, Math.round(AH * 0.065));
    if (P.night) {
      for (let i = 0; i < 70; i++) {
        const big = i % 7 === 0;
        g.fillStyle = i % 5 === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.6)';
        g.fillRect((i * 97) % AW, (i * 53) % Math.round(AH * 0.75), big ? 2 : 1, big ? 2 : 1);
      }
      pdisc(g, sx, sy, R, P.sun);
      pdisc(g, sx + R * 0.5, sy - R * 0.25, R * 0.85, mix(top, bot, sy / AH));
    } else {
      pdisc(g, sx, sy, R + 5, 'rgba(255,255,255,0.28)');
      pdisc(g, sx, sy, R + 2, P.sunRim);
      pdisc(g, sx, sy, R, P.sun);
      g.fillStyle = P.sunRim;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        for (let r = R + 4; r <= R + 6; r++) g.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r), 1, 1);
      }
    }
    return c;
  }

  function treeAt(g, x, y, r, P) {
    const cx = x, cy = y - r - 2;
    for (let yy = cy - r; yy <= cy + r; yy++) {
      for (let xx = cx - r; xx <= cx + r; xx++) {
        const dx = xx + 0.5 - cx, dy = yy + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) { g.fillStyle = dy > r * 0.25 ? P.treeDark : P.tree; g.fillRect(xx, yy, 1, 1); }
      }
    }
    g.fillStyle = P.trunk;
    g.fillRect(cx - 1, cy + r - 1, 2, y - (cy + r - 1));
  }

  /* Cerros periódicos (para que se repitan sin cortes). */
  function hillTile(TW, TH, base, amp, fillCol, edgeCol, trees, P) {
    const c = NV.mk(TW, TH), g = c.getContext('2d');
    const hy = x => base + amp * Math.sin((2 * Math.PI * x) / TW * 2)
      + amp * 0.5 * Math.sin((2 * Math.PI * x) / TW * 3 + 1.3)
      + amp * 0.3 * Math.sin((2 * Math.PI * x) / TW * 5 + 0.4);
    for (let x = 0; x < TW; x++) {
      const top = Math.round(hy(x));
      g.fillStyle = fillCol; g.fillRect(x, top, 1, TH - top);
      g.fillStyle = edgeCol; g.fillRect(x, top, 1, 1);
    }
    if (trees) {
      for (const tx of trees.xs) {
        const ty = Math.round(hy(tx));
        for (const off of [-TW, 0, TW]) treeAt(g, tx + off, ty, trees.r, P);
      }
    }
    return c;
  }

  function groundTile(TW, GH, P) {
    const c = NV.mk(TW, GH), g = c.getContext('2d');
    g.fillStyle = P.soil; g.fillRect(0, 0, TW, GH);
    for (let x = 0; x < TW; x++) {
      g.fillStyle = P.grass; g.fillRect(x, 0, 1, 2);
      g.fillStyle = P.grassDark; g.fillRect(x, 2, 1, 1);
      for (let y = 3; y < GH; y++) {
        const h = Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
        if (h < 0.1) { g.fillStyle = P.soilDark; g.fillRect(x, y, 1, 1); }
      }
    }
    for (let i = 0; i < 9; i++) {
      const fx = 6 + i * 35 + (i % 3) * 3;
      g.fillStyle = P.flower; g.fillRect(fx, 0, 1, 1); g.fillRect(fx + 1, 1, 1, 1);
    }
    return c;
  }

  function seaTile(TW, SH, P) {
    const c = NV.mk(TW, SH), g = c.getContext('2d');
    for (let x = 0; x < TW; x++) {
      const top = Math.round(7 + 1.6 * Math.sin((2 * Math.PI * x) / TW * 4));
      g.fillStyle = P.sea; g.fillRect(x, top, 1, SH - top);
      g.fillStyle = P.seaShade; g.fillRect(x, SH - 4, 1, 4);
      g.fillStyle = P.seaLine; g.fillRect(x, top, 1, 1);
    }
    for (let bx = 0; bx < TW; bx += 32) {
      pdisc(g, bx + 16, 10, 7.5, P.seaLine);
      pdisc(g, bx + 16, 10, 6.5, P.sea);
    }
    return c;
  }

  const cache = {};
  let count = 0;

  /* Prepara (y guarda en caché) los recursos de un escenario. */
  function make(bi, W, H, groundY, sea) {
    const key = [bi, Math.round(W), Math.round(H), groundY == null ? 'x' : Math.round(groundY), sea ? 1 : 0].join('|');
    if (cache[key]) return cache[key];
    if (count > 12) { for (const k in cache) delete cache[k]; count = 0; }
    count++;
    const P = BIOME[bi], AW = Math.ceil(W / PX) + 1, AH = Math.ceil(H / PX) + 1;
    const r = { bi, W, H, groundY, sea, sky: buildSky(bi, AW, AH), clouds: [], birds: [] };
    if (!sea) {
      r.far = hillTile(320, 46, 17, 5, P.far, P.farEdge, null, P);
      r.near = hillTile(320, 44, 24, 4, P.near, P.nearEdge, { xs: [20, 96, 170, 236, 300], r: 4 }, P);
      r.ground = groundTile(320, Math.ceil((H - groundY) / PX) + 3, P);
    } else {
      r.sea = seaTile(320, 24, P);
    }
    const rnd = seeded(bi * 31 + (sea ? 5 : 11));
    for (let i = 0; i < 9; i++) {
      const near = i % 2 === 1;
      r.clouds.push({
        img: NV.Art.cloud(i, P.cloud),
        sc: near ? 1.05 + rnd() * 0.3 : 0.6 + rnd() * 0.2,
        f: rnd(),
        sp: near ? 0.13 : 0.05,
        y: near ? H * (0.08 + rnd() * 0.3) : H * (0.02 + rnd() * 0.22),
      });
    }
    for (let i = 0; i < 4; i++) r.birds.push({ f: rnd(), y: H * (0.08 + rnd() * 0.22), sp: 22 + rnd() * 16, ph: rnd() * 6 });
    return (cache[key] = r);
  }

  function tiled(ctx, img, y, off, W) {
    const tw = img.width * PX, th = img.height * PX;
    for (let x = -(off % tw); x < W; x += tw) ctx.drawImage(img, x, y, tw, th);
  }

  /* Dibuja el escenario. o = { scroll: distancia recorrida, clk: tiempo } */
  function draw(ctx, r, o) {
    const { W, H, groundY } = r, P = BIOME[r.bi];
    ctx.drawImage(r.sky, 0, 0, W, H);
    for (const c of r.clouds) {
      const cw = c.img.width * PX * c.sc, L = W + cw;
      const x = ((((c.f * L) - o.scroll * c.sp) % L) + L) % L - cw;
      ctx.drawImage(c.img, x, c.y, cw, c.img.height * PX * c.sc);
    }
    /* Los pájaros vuelan con su propio tiempo (no dependen del desplazamiento) y aletean. */
    for (const b of r.birds) {
      const L = W + 80;
      const x = ((((b.f * L) + o.clk * b.sp) % L) + L) % L - 40;
      const y = b.y + Math.sin(o.clk * 2.2 + b.ph) * 4;
      const bm = NV.Art.bird(Math.floor(o.clk * 6 + b.f * 4));
      const s = PX * 1.3;
      ctx.drawImage(bm, x, y, bm.width * s, bm.height * s);
    }
    if (!r.sea) {
      tiled(ctx, r.far, groundY - r.far.height * PX + 2 * PX, o.scroll * 0.18, W);
      tiled(ctx, r.near, groundY - r.near.height * PX + 3 * PX, o.scroll * 0.4, W);
      tiled(ctx, r.ground, groundY, o.scroll, W);
    } else {
      const top = H - r.sea.height * PX;
      ctx.fillStyle = P.sea;
      ctx.fillRect(0, top + 8 * PX, W, H);
      tiled(ctx, r.sea, top, o.scroll * 0.6, W);
    }
  }

  /* Cambio de día: cuando cambia la hora, el escenario nuevo aparece poco a poco sobre el anterior. */
  function track(sea) {
    let cur = null, prev = null, bi = -1, t = 1, sig = '';
    return {
      update(nbi, W, H, groundY, dt) {
        const s = [Math.round(W), Math.round(H), Math.round(groundY || 0)].join('|');
        if (s !== sig) { sig = s; cur = null; prev = null; bi = -1; t = 1; }
        if (nbi !== bi) {
          if (cur) { prev = cur; t = 0; }
          cur = make(nbi, W, H, groundY, sea);
          bi = nbi;
        }
        if (t < 1) { t = Math.min(1, t + dt / 1.4); if (t >= 1) prev = null; }
      },
      render(ctx, opts) {
        if (!cur) return;
        if (prev && t < 1) { draw(ctx, prev, opts); ctx.globalAlpha = t; }
        draw(ctx, cur, opts);
        ctx.globalAlpha = 1;
      },
    };
  }

  NV.Scene = { make, draw, BIOME, track };
})();
