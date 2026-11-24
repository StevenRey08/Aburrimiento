/* Escenarios pixel art: cielo con sol o luna, nubes, cerros con árboles, pasto o mar de nubes. */
(() => {
  'use strict';
  const NV = window.NV, PX = NV.PX;

  const BIOME = [
    {
      skyTop: '#8BD1F5', skyBot: '#FFF3DA', sun: '#FFF5B8', sunRim: '#FFD154',
      far: '#BDE5B5', farEdge: '#A2D69A', near: '#8FD082', nearEdge: '#6FB866',
      treeHi: '#7CD176', tree: '#56A95C', treeDark: '#3A7B44', trunk: '#7A4E2D',
      grassHi: '#A8E38E', grass: '#86CC74', grassDark: '#63AB58', soil: '#D2A276', soilDark: '#AD7E54',
      flower: '#FF9EC2', flower2: '#FFE278',
      seaHi: '#FFFFFF', sea: '#F4F9FF', seaShade: '#D3E6FA', seaLine: '#A6CCF1',
      cloud: { body: '#FFFFFF', shade: '#D7E8FA', line: '#95BEE8' }, night: false,
    },
    {
      skyTop: '#F09188', skyBot: '#FFE2B8', sun: '#FFE194', sunRim: '#F79D45',
      far: '#E6B29C', farEdge: '#D69881', near: '#D6937B', nearEdge: '#B87561',
      treeHi: '#DF9F6B', tree: '#C68454', treeDark: '#965C3C', trunk: '#6B4330',
      grassHi: '#E8B67F', grass: '#D59B67', grassDark: '#B3784D', soil: '#B57A59', soilDark: '#8E5C42',
      flower: '#FFE28A', flower2: '#FFB3C9',
      seaHi: '#FFF9F2', sea: '#FFF2E6', seaShade: '#F4CCB8', seaLine: '#E4A086',
      cloud: { body: '#FFF5EE', shade: '#F6CCBC', line: '#D49084' }, night: false,
    },
    {
      skyTop: '#17264D', skyBot: '#5367A1', sun: '#F7F2D4', sunRim: '#C5D0F6',
      far: '#32477D', farEdge: '#293B6B', near: '#27396B', nearEdge: '#1E305B',
      treeHi: '#4D73AA', tree: '#38588A', treeDark: '#27406B', trunk: '#1E2B54',
      grassHi: '#5373B8', grass: '#3F5B9B', grassDark: '#30467C', soil: '#2B3C6B', soilDark: '#1F2D57',
      flower: '#D7C4FF', flower2: '#FFE694',
      seaHi: '#AEBBE8', sea: '#8D9BD0', seaShade: '#6D7DB8', seaLine: '#55639E',
      cloud: { body: '#92A4DE', shade: '#7081C2', line: '#4B5A98' }, night: true,
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
    const top = rgb(P.skyTop), bot = rgb(P.skyBot), BANDS = 11;
    for (let y = 0; y < AH; y++) {
      const f = (y / AH) * (BANDS - 1);
      const b0 = Math.min(BANDS - 1, Math.floor(f));
      const b1 = Math.min(BANDS - 1, b0 + 1);
      const frac = f - b0;
      const c0 = mix(top, bot, b0 / (BANDS - 1));
      const c1 = mix(top, bot, b1 / (BANDS - 1));
      if (frac > 0.72 && b1 > b0) {
        g.fillStyle = c0; g.fillRect(0, y, AW, 1);
        g.fillStyle = c1;
        for (let x = y % 2; x < AW; x += 2) g.fillRect(x, y, 1, 1);
      } else {
        g.fillStyle = c0; g.fillRect(0, y, AW, 1);
      }
    }
    const sx = Math.round(AW * 0.8), sy = Math.round(AH * 0.2), R = Math.max(5, Math.round(AH * 0.065));
    if (P.night) {
      for (let i = 0; i < 75; i++) {
        const x = (i * 97 + 13) % AW, y = (i * 53 + 7) % Math.round(AH * 0.75);
        if (i % 13 === 0) {
          g.fillStyle = '#FFF7C2';
          g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
        } else {
          g.fillStyle = i % 4 === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.55)';
          g.fillRect(x, y, 1, 1);
        }
      }
      pdisc(g, sx, sy, R + 3, 'rgba(247,242,212,0.16)');
      pdisc(g, sx, sy, R, P.sun);
      pdisc(g, sx + R * 0.48, sy - R * 0.24, R * 0.85, mix(top, bot, sy / AH));
    } else {
      pdisc(g, sx, sy, R + 6, 'rgba(255,255,255,0.22)');
      pdisc(g, sx, sy, R + 3, 'rgba(255,255,255,0.34)');
      pdisc(g, sx, sy, R + 1.6, P.sunRim);
      pdisc(g, sx, sy, R, P.sun);
      g.fillStyle = P.sunRim;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6, len = i % 2 === 0 ? R + 6 : R + 4;
        for (let r = R + 3; r <= len; r++) g.fillRect(Math.round(sx + Math.cos(a) * r), Math.round(sy + Math.sin(a) * r), 1, 1);
      }
    }
    return c;
  }

  function treeAt(g, x, y, r, P) {
    const cx = x, cy = y - r - 2;
    g.fillStyle = P.trunk;
    g.fillRect(cx - 1, cy + r - 1, 2, y - (cy + r - 1));
    for (let yy = cy - r; yy <= cy + r; yy++) {
      for (let xx = cx - r; xx <= cx + r; xx++) {
        const dx = xx + 0.5 - cx, dy = yy + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) {
          g.fillStyle = dy > r * 0.25 ? P.treeDark : (dx < -r * 0.15 && dy < -r * 0.15 ? P.treeHi : P.tree);
          g.fillRect(xx, yy, 1, 1);
        }
      }
    }
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
      const tuft = (x * 7 + (x % 3)) % 5 === 0 ? 1 : 0;
      g.fillStyle = P.grassHi; g.fillRect(x, 0, 1, 1);
      g.fillStyle = P.grass; g.fillRect(x, 1, 1, 1 + tuft);
      g.fillStyle = P.grassDark; g.fillRect(x, 2 + tuft, 1, 1);
      for (let y = 4; y < GH; y++) {
        const h = Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
        if (h < 0.08) { g.fillStyle = P.soilDark; g.fillRect(x, y, 1, 1); }
        else if (h > 0.975 && y > 6) { g.fillStyle = P.soilDark; g.fillRect(x, y, 2, 1); }
      }
    }
    for (let i = 0; i < 11; i++) {
      const fx = 6 + i * 29 + (i % 3) * 2;
      g.fillStyle = i % 2 === 0 ? P.flower : P.flower2;
      g.fillRect(fx, 0, 1, 1);
      g.fillRect(fx + 1, 0, 1, 1);
      g.fillStyle = '#FFFFFF';
      g.fillRect(fx, 1, 1, 1);
    }
    return c;
  }

  function seaTile(TW, SH, P) {
    const c = NV.mk(TW, SH), g = c.getContext('2d');
    for (let x = 0; x < TW; x++) {
      const top = Math.round(7 + 1.6 * Math.sin((2 * Math.PI * x) / TW * 4));
      g.fillStyle = P.sea; g.fillRect(x, top, 1, SH - top);
      g.fillStyle = P.seaShade; g.fillRect(x, SH - 5, 1, 5);
      g.fillStyle = P.seaLine; g.fillRect(x, top, 1, 1);
    }
    for (let bx = 0; bx < TW; bx += 32) {
      pdisc(g, bx + 16, 10, 8, P.seaLine);
      pdisc(g, bx + 16, 10, 7, P.sea);
      pdisc(g, bx + 14, 8, 4.2, P.seaHi);
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
