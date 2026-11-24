/* Vuelo de Marian: sube con la mano, aletea en el aire, hace ráfagas, junta estrellas y corazones. */
(() => {
  'use strict';
  const NV = window.NV, $ = NV.$, A = NV.Art, PX = NV.PX;
  const root = $('fly'), cv = $('fl'), ctx = cv.getContext('2d');
  const el = { score: $('lScore'), lives: $('lLives'), msg: $('lMsg'), best: $('lBest'), dash: $('lDash') };
  const panels = { start: $('lStart'), pause: $('lPausePanel'), over: $('lOver') };
  const track = NV.Scene.track(true);
  const STORM_W = 64 * PX, STORM_H = 40 * PX;
  /* Física suave: gravedad baja, empuje moderado y velocidad de caída con tope. */
  const GRAV = 620, THRUST = 980, VMIN = -340, VMAX = 280;
  const MAGNET_R = 96;
  const DASH_T = 0.55, DASH_CD = 4, FLAP_CD = 1;
  const RB = ['#FF9AB8', '#FFE08A', '#C5EDD1', '#8AC0E6', '#C9B6F5'];
  const CHEER = ['¡Qué bonito vuelo!', '¡Eres la mejor, {n}!'];
  const OVER = ['Volaste precioso, {n}', 'Casi, casi. ¿Otra vuelta?'];
  const HIT = ['¡Ay! Otra vez, tú puedes', '¡Ánimo, {n}!'];

  let fit = null, FLOOR = 0, st = 'closed', clk = 0, hold = false, lastScore = -1, dashLabel = '';
  let g = {};

  function layout() {
    fit = NV.fitWorld(root, cv, ctx);
    FLOOR = fit.H - 62;
  }
  const score = () => g.stars * 10 + Math.floor(g.dist / 60);
  /* La puntuación solo se escribe cuando cambia, para no gastar trabajo en cada cuadro. */
  function setHud() {
    const s = score();
    if (s !== lastScore) { lastScore = s; el.score.textContent = s; }
  }
  function say(text, sec) {
    if (!text) { el.msg.classList.remove('show'); g.msgT = 0; return; }
    el.msg.textContent = NV.fill(text);
    el.msg.classList.add('show');
    g.msgT = sec || 2;
  }
  /* Quita lo que ya no sirve sin crear arreglos nuevos en cada cuadro. */
  function compact(arr, keep) {
    let j = 0;
    for (let i = 0; i < arr.length; i++) if (keep(arr[i])) arr[j++] = arr[i];
    arr.length = j;
  }
  function reset() {
    g = {
      t: 0, speed: 170, dist: 0, stars: 0, lives: 3, inv: 0, hurt: 0, shield: 0,
      dashT: 0, dashCd: 0, flapCd: 0, flapPh: 0, flapSp: 8,
      x: fit ? fit.W * 0.24 : 90, y: fit ? fit.H * 0.42 : 300, dy: 0, vy: 0, rot: 0,
      obs: [], items: [], parts: [],
      nextObs: 2.2, nextItem: 1.2, nextHeart: 14,
      biome: 0, bump: 0, milestone: 300, msgT: 0, newRec: false, overMsg: '',
    };
    g.dy = g.y;
    lastScore = -1;
    dashLabel = '';
    NV.hearts(el.lives, 3);
    setHud();
  }
  function burst(x, y, col, n) {
    if (g.parts.length > 50) return;
    for (let i = 0; i < n; i++) {
      g.parts.push({ x, y, vx: NV.rand(-140, 140), vy: NV.rand(-180, 40), t: 0, life: NV.rand(0.45, 0.8), c: col });
    }
  }
  function updateParts(dt) {
    let j = 0;
    for (let i = 0; i < g.parts.length; i++) {
      const p = g.parts[i];
      p.t += dt;
      if (p.t >= p.life) continue;
      p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      g.parts[j++] = p;
    }
    g.parts.length = j;
  }
  function drawParts() {
    for (const p of g.parts) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  function spawnStorm() {
    g.obs.push({
      x: fit.W + 40, y0: NV.rand(90, FLOOR - 180), y: 0, amp: NV.rand(10, 26),
      ph: NV.rand(0, 6), w: STORM_W, h: STORM_H, bolt: NV.rand(0, 1), dead: false,
    });
  }
  function spawnStars() {
    const y0 = NV.rand(120, FLOOR - 140);
    for (let i = 0; i < 5; i++) {
      g.items.push({ k: 'star', x: fit.W + 40 + i * 30, y: y0 + Math.sin(i * 0.9) * 22, taken: false, ph: i * 0.7 });
    }
  }
  function spawnBubble() {
    g.items.push({ k: 'burbuja', x: fit.W + 40, y: NV.rand(130, FLOOR - 140), taken: false, ph: NV.rand(0, 6) });
  }
  function spawnHeart() {
    g.items.push({ k: 'corazon', x: fit.W + 40, y: NV.rand(130, FLOOR - 140), taken: false, ph: 0 });
  }

  function hurtMarian() {
    g.lives--; g.inv = 1.4; g.hurt = 0.6; g.vy = -160;
    NV.Sound.whine(); NV.buzz(40);
    NV.hearts(el.lives, g.lives);
    burst(g.x, g.dy, '#FF9AB8', 10);
    if (g.lives <= 0) { gameOver(); return; }
    say(NV.pick(HIT), 1.4);
  }
  function overInfo() {
    $('lOverTitle').textContent = g.newRec ? '¡Récord nuevo!' : '¡Aterrizaje suave!';
    $('lFinal').textContent = score();
    $('lNew').hidden = !g.newRec;
    $('lOverMsg').textContent = NV.fill(g.overMsg);
    $('lSaved').textContent = 'Récord: ' + NV.Best.get('fly');
    el.best.textContent = NV.Best.get('fly');
  }
  function gameOver() {
    if (st === 'over') return;
    st = 'over';
    hold = false;
    g.newRec = NV.Best.offer('fly', score());
    g.overMsg = g.newRec ? '¡Eres increíble, {n}! Ese récord es tuyo.' : NV.pick(OVER);
    say('', 0);
    overInfo();
    NV.showPanel(panels, 'over');
    NV.Sound.whine();
  }

  /* Habilidades: aletear en el aire, ráfaga hacia adelante y escudo con burbujas. */
  function tap() {
    if (st !== 'play') return;
    hold = true;
    if (g.flapCd <= 0 && g.vy > 40) {
      g.vy = -360; g.flapCd = FLAP_CD;
      g.flapPh = 6;
      g.flapSp = 18;
      burst(g.x - 16, g.dy + 10, '#FFFFFF', 4);
      burst(g.x + 16, g.dy + 10, '#FFFFFF', 4);
      NV.Sound.squeak();
    } else if (g.vy > -110) {
      g.vy = -110;
    }
  }
  function dash() {
    if (st !== 'play' || g.dashCd > 0) return;
    g.dashT = DASH_T; g.dashCd = DASH_CD;
    NV.Sound.chime(); NV.buzz(15);
  }

  function open() {
    layout();
    reset();
    st = 'start';
    hold = false;
    NV.showPanel(panels, 'start');
    say('', 0);
    el.best.textContent = NV.Best.get('fly');
  }
  function close() { st = 'closed'; hold = false; }
  function start() {
    NV.Sound.ensure();
    layout();
    reset();
    st = 'play';
    hold = false;
    NV.showPanel(panels, null);
    say('¡Arriba, Marian! Mantén presionado para subir. Suelta y cae suavecito', 3);
    NV.Sound.chime();
  }
  function pause() {
    if (st !== 'play') return;
    st = 'pause';
    hold = false;
    NV.showPanel(panels, 'pause');
  }
  function resume() {
    if (st !== 'pause') return;
    st = 'play';
    NV.showPanel(panels, null);
  }

  function update(dt) {
    if (g.msgT > 0) { g.msgT -= dt; if (g.msgT <= 0) el.msg.classList.remove('show'); }
    g.t += dt;
    g.speed = Math.min(320, 170 + g.t * 6);
    const sp = g.speed * dt;
    g.dist += sp;
    g.inv -= dt; g.hurt -= dt; g.shield -= dt; g.bump -= dt;
    g.dashT -= dt; g.dashCd -= dt; g.flapCd -= dt;
    const targetSp = hold || g.dashT > 0 || g.vy < -50 ? 15 : 7;
    g.flapSp += (targetSp - g.flapSp) * (1 - Math.exp(-6 * dt));
    g.flapPh = (g.flapPh + dt * g.flapSp) % 8;

    /* Ráfaga: Marian sale disparada hacia adelante y deja un rastro de colores. */
    const dashing = g.dashT > 0;
    const tx = dashing ? fit.W * 0.46 : fit.W * 0.24;
    g.x += (tx - g.x) * (1 - Math.exp(-(dashing ? 14 : 5) * dt));
    if (dashing) burst(g.x - 26, g.y, RB[Math.floor(clk * 20) % RB.length], 1);

    const label = g.dashCd > 0 ? Math.ceil(g.dashCd) + 's' : 'Ráfaga';
    if (label !== dashLabel) { dashLabel = label; el.dash.textContent = label; el.dash.disabled = g.dashCd > 0; }

    /* Vuelo: con la mano sube despacio; al soltar cae suave, con tope de velocidad. */
    g.vy += (hold ? -THRUST : GRAV) * dt;
    g.vy = NV.clamp(g.vy, VMIN, VMAX);
    g.y += g.vy * dt;
    if (g.y < 36) { g.y = 36; if (g.vy < 0) g.vy = 0; }
    if (g.y > FLOOR) {
      g.y = FLOOR;
      if (g.vy > 0) {
        if (g.vy > 120) { burst(g.x, FLOOR + 20, '#FFFFFF', 6); NV.Sound.boing(); }
        g.vy = -Math.min(g.vy, 200) * 0.45;
        if (g.bump <= 0) { say('¡Plof! Rebotaste en la nube', 1.5); g.bump = 10; }
      }
    }
    /* Lo que se ve sigue a la posición real con suavidad, sin saltos bruscos. */
    g.dy += (g.y - g.dy) * (1 - Math.exp(-16 * dt));
    g.rot += (NV.clamp(g.vy / 900, -0.25, 0.4) - g.rot) * (1 - Math.exp(-8 * dt));

    g.nextObs -= dt;
    if (g.nextObs <= 0) { spawnStorm(); g.nextObs = Math.max(1.6, 2.7 - g.t * 0.01) * NV.rand(0.9, 1.2); }
    g.nextItem -= dt;
    if (g.nextItem <= 0) {
      if (Math.random() < 0.14) spawnBubble(); else spawnStars();
      g.nextItem = NV.rand(2.4, 3.4);
    }
    g.nextHeart -= dt;
    if (g.nextHeart <= 0) { spawnHeart(); g.nextHeart = NV.rand(14, 20); }

    for (const o of g.obs) {
      o.x -= sp;
      o.ph += dt * 1.2;
      o.y = o.y0 + Math.sin(o.ph) * o.amp;
    }
    for (const it of g.items) {
      it.x -= sp;
      it.ph += dt * 3;
      /* Las estrellas cercanas se acercan suavecito a Marian, así se toman fácil. */
      if (it.k === 'star' && !it.taken && Math.hypot(it.x - g.x, it.y - g.y) < MAGNET_R) {
        it.y += (g.y - it.y) * (1 - Math.exp(-6 * dt));
      }
    }

    /* Nubarrones: con escudo o ráfaga los deshace; si no, pegan. */
    for (const o of g.obs) {
      if (o.dead) continue;
      if (!NV.circleRect(g.x, g.y, 16, o.x + 16, o.y + 18, o.w - 32, o.h - 30)) continue;
      if (g.shield > 0 || dashing) {
        o.dead = true;
        burst(o.x + o.w / 2, o.y + o.h / 2, '#FFE08A', 14);
        NV.Sound.pop();
        g.stars += 1;
      } else if (g.inv <= 0) {
        hurtMarian();
        break;
      }
    }
    if (st !== 'play') { updateParts(dt); return; }
    compact(g.obs, o => o.x > -140 && !o.dead);

    for (const it of g.items) {
      if (it.taken) continue;
      const r = it.k === 'star' ? 30 : 34;
      if (Math.hypot(it.x - g.x, it.y - g.y) >= r) continue;
      it.taken = true;
      if (it.k === 'star') {
        g.stars++;
        burst(it.x, it.y, '#FFE08A', 6);
        NV.Sound.pop();
      } else if (it.k === 'burbuja') {
        g.shield = 4;
        burst(it.x, it.y, '#C9B6F5', 12);
        NV.Sound.chime();
      } else if (g.lives < 3) {
        g.lives++;
        NV.hearts(el.lives, g.lives);
        burst(it.x, it.y, '#FF9DBB', 10);
        NV.Sound.chime();
        say('¡Un corazón más, {n}!', 1.6);
      } else {
        g.stars += 2;
        burst(it.x, it.y, '#FF9DBB', 8);
        NV.Sound.pop();
      }
    }
    compact(g.items, it => it.x > -60 && !it.taken);
    setHud();

    const sc = score();
    if (sc >= g.milestone) {
      g.milestone += 300;
      say(NV.pick(CHEER), 2);
      NV.Sound.chime();
    }
    const bi = sc >= 700 ? 2 : sc >= 300 ? 1 : 0;
    if (bi !== g.biome) {
      g.biome = bi;
      say(['¡Cielo de día!', '¡Llegó el atardecer!', '¡Ya es noche, mira las estrellas!'][bi], 2.2);
    }
    updateParts(dt);
  }

  function drawStorm(o) {
    ctx.drawImage(A.storm(), o.x, o.y, o.w, o.h);
    if ((clk * 0.6 + o.bolt) % 1 < 0.1) {
      const bs = 7 * PX;
      ctx.drawImage(A.bolt(), o.x + o.w / 2 - bs / 2, o.y + o.h - 4, bs, bs);
    }
  }
  function drawItem(it) {
    if (it.k === 'star') {
      const s = 11 * PX, bob = Math.sin(it.ph) * 2;
      ctx.drawImage(A.star(), it.x - s / 2, it.y - s / 2 + bob, s, s);
    } else if (it.k === 'burbuja') {
      const s = 14 * PX, bob = Math.sin(it.ph) * 3;
      ctx.drawImage(A.bubble(), it.x - s / 2, it.y - s / 2 + bob, s, s);
    } else {
      const bob = Math.sin(it.ph) * 3;
      ctx.drawImage(A.heart(), it.x - 10.5, it.y - 9 + bob, 21, 18);
    }
  }
  function drawMarian() {
    const face = g.hurt > 0 ? 'ugh' : g.vy < -40 ? 'happy' : 'open';
    ctx.save();
    ctx.translate(g.x, g.dy);
    if (g.shield > 0 || g.dashT > 0) {
      for (let i = 0; i < 16; i++) {
        const a = clk * 1.6 + (i * Math.PI) / 8;
        ctx.fillStyle = RB[i % RB.length];
        ctx.fillRect(Math.cos(a) * 46 - 3, Math.sin(a) * 46 - 3, 6, 6);
      }
    }
    const blink = g.inv > 0 && Math.floor(clk * 10) % 2 === 0;
    if (!blink) {
      ctx.rotate(g.rot);
      const earFrame = st === 'play'
        ? Math.floor(g.flapPh) % 8
        : Math.floor(clk * 7) % 8;
      A.drawFlyChar(ctx, face, earFrame, 0, 27);
    }
    ctx.restore();
  }
  function draw() {
    if (!fit) return;
    track.render(ctx, { scroll: g.dist || 0, clk });
    for (const it of g.items) drawItem(it);
    for (const o of g.obs) drawStorm(o);
    drawMarian();
    drawParts();
  }

  function tick(dt) {
    clk += dt;
    if (fit) track.update(g.biome || 0, fit.W, fit.H, null, dt);
    if (st === 'play') update(dt);
    draw();
  }

  root.addEventListener('pointerdown', e => {
    if (e.target.closest('button, .panel')) return;
    tap();
  });
  const up = () => { hold = false; };
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  el.dash.addEventListener('pointerdown', e => { e.preventDefault(); dash(); });
  $('lPlay').addEventListener('click', start);
  $('lAgain').addEventListener('click', start);
  $('lResume').addEventListener('click', resume);
  $('lPauseBtn').addEventListener('click', pause);

  NV.Fly = {
    open, close, tick,
    resize: () => { if (st !== 'closed') layout(); },
    pauseIfPlaying: pause,
    key(code, down, e) {
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        if (e) e.preventDefault();
        if (down) tap(); else hold = false;
      } else if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyX') {
        if (down) dash();
      } else if (down && (code === 'Escape' || code === 'KeyP')) {
        if (st === 'play') pause(); else if (st === 'pause') resume();
      }
    },
  };
})();
