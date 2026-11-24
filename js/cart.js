/* Paseo en tronco: parecido al juego del dinosaurio de Google. Marian o Rey van sobre el tronco que corre.
   Se salta piedras y troncos caídos, y se agacha de los pájaros que vienen a la altura de la cabeza.
   Todo lo hace la jugadora: no hay salto ni agachada automáticos. */
(() => {
  'use strict';
  const NV = window.NV, $ = NV.$, A = NV.Art, PX = NV.PX;
  const root = $('cart'), cv = $('cc'), ctx = cv.getContext('2d');
  const el = {
    score: $('cScore'), lives: $('cLives'), msg: $('cMsg'), best: $('cBest'), play: $('cPlay'),
  };
  const panels = { menu: $('cStart'), pause: $('cPausePanel'), over: $('cOver') };
  const pickBtns = root.querySelectorAll('[data-cchar]');

  /* Medidas en unidades del mundo. El tronco tiene 60 pixeles de arte: corto y parejo con el personaje. */
  const CART_W = 60 * PX, LOG_H = 19 * PX;
  const WHEEL = 22;
  const STUMP_W = 28 * 2.4, STUMP_H = 20 * 2.4;
  const FLOG_W = 28 * 2.4, FLOG_H = 9 * 2.4;
  const BIRD_W = 14 * 2.4, BIRD_H = 10 * 2.4;
  /* Pies y caja de choque, medidos desde la parte de arriba del tronco (sin saltar) */
  const FEET_STAND = 2, FEET_DUCK = 22;
  const BOX_STAND = -48, BOX_DUCK = -26, BOX_BOTTOM = LOG_H - 2;
  /* Salto parecido al del dinosaurio: sube, cae rápido y se queda en el aire lo justo */
  const JV = 820, GRAV = 2000, FAST_FALL = 2.2;
  const NAMES = ['de día', 'de atardecer', 'de noche'];
  const CHEER = ['¡Qué buena puntería, {n}!', '¡Vas increíble!'];
  const HIT = ['¡Ay! Otra vez, tú puedes', '¡Ánimo, {n}!'];
  const OVER = ['Qué bien paseaste, {n}', 'Casi lo logras, ¿otra vuelta?'];

  const input = { jump: false, duck: false };
  const track = NV.Scene.track(false);
  let who = null, fit = null, gY = 0, cartX = 0, st = 'closed', clk = 0;
  let g = {};

  /* El suelo es gY. Las ruedas tocan el suelo y el tronco va encima de ellas. */
  const restTop = () => gY - 16 - LOG_H;
  const rigTop = () => restTop() + g.py;
  const cxCart = () => cartX + CART_W / 2;

  function pick(k) {
    who = k;
    pickBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cchar === k)));
    el.play.disabled = false;
  }
  pickBtns.forEach(b => b.addEventListener('click', () => pick(b.dataset.cchar)));
  root.querySelectorAll('[data-cchar] img').forEach(im => {
    im.src = NV.Art.dataURL(A.char(im.parentElement.dataset.cchar, 'happy'));
  });

  function layout() {
    fit = NV.fitWorld(root, cv, ctx);
    gY = fit.H - 110 / fit.s; /* deja libre la franja de botones */
    cartX = Math.round(fit.W * 0.12);
  }
  function reset() {
    g = {
      t: 0, speed: 260, dist: 0, score: 0, coins: 0, lives: 3, inv: 0, hit: 0,
      py: 0, vy: 0, tilt: 0, ground: true, coyote: 0, jbuf: 0,
      obs: [], items: [], parts: [], nextObs: 520, nextItem: 240,
      biome: 0, milestone: 500, msgT: 0, newRec: false, overMsg: '',
    };
    NV.hearts(el.lives, 3);
    el.score.textContent = '0';
  }
  function say(text, sec) {
    if (!text) { el.msg.classList.remove('show'); g.msgT = 0; return; }
    el.msg.textContent = NV.fill(text);
    el.msg.classList.add('show');
    g.msgT = sec || 2;
  }
  function burst(x, y, col, n) {
    if (g.parts.length > 50) return;
    for (let i = 0; i < n; i++) {
      g.parts.push({ x, y, vx: NV.rand(-150, 150), vy: NV.rand(-220, -50), t: 0, life: NV.rand(0.45, 0.8), c: col });
    }
  }
  function updateParts(dt) {
    let j = 0;
    for (let i = 0; i < g.parts.length; i++) {
      const p = g.parts[i];
      p.t += dt;
      if (p.t >= p.life) continue;
      p.vy += 480 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
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

  /* Caja de choque del personaje. Agachado, la caja baja y deja pasar a los pájaros de cabeza. */
  function box() {
    const top = rigTop();
    const y = top + (input.duck ? BOX_DUCK : BOX_STAND);
    return { x: cxCart() - 18, y, w: 36, h: top + BOX_BOTTOM - y };
  }
  function hitRect(o) {
    if (o.k === 'stump' || o.k === 'flog') return { x: o.x + 6, y: o.y + 4, w: o.w - 12, h: o.h - 4 };
    return { x: o.x + 4, y: o.y + 3, w: o.w - 8, h: o.h - 6 };
  }

  /* Obstáculos: piedras y troncos caídos para saltar; pájaros para saltar o agacharse según la altura. */
  function spawnObstacle() {
    const x = fit.W + 40, r = Math.random(), rest = restTop();
    if (g.score >= 100 && r < 0.28) {
      const b = Math.random();
      if (b < 0.4) g.obs.push({ k: 'low', x, y: rest + 4, w: BIRD_W, h: BIRD_H, ph: 0 });
      else if (b < 0.75) g.obs.push({ k: 'mid', x, y: rest - 52, w: BIRD_W, h: BIRD_H, ph: 0 });
      else g.obs.push({ k: 'high', x, y: rest - 120, w: BIRD_W, h: BIRD_H, ph: 0 });
    } else if (r < 0.66) {
      g.obs.push({ k: 'stump', x, y: gY - STUMP_H, w: STUMP_W, h: STUMP_H });
    } else {
      g.obs.push({ k: 'flog', x, y: gY - FLOG_H, w: FLOG_W, h: FLOG_H });
    }
  }
  function spawnHearts() {
    const r = Math.random(), rest = restTop();
    const yc = r < 0.45 ? rest + 8 : r < 0.8 ? rest - 40 : rest - 100;
    for (let i = 0; i < 3; i++) g.items.push({ x: fit.W + 40 + i * 34, y: yc, taken: false, ph: i * 0.6 });
  }

  function hitPlayer() {
    g.lives--; g.inv = 1.2; g.hit = 0.5;
    NV.Sound.whine(); NV.buzz(40);
    NV.hearts(el.lives, g.lives);
    burst(cxCart(), restTop() + LOG_H, '#FF9AB8', 12);
    if (g.lives <= 0) { gameOver(); return; }
    say(NV.pick(HIT), 1.4);
  }
  function overInfo() {
    $('cOverTitle').textContent = g.newRec ? '¡Récord nuevo!' : '¡Se detuvo el tronco!';
    $('cFinal').textContent = g.score;
    $('cNew').hidden = !g.newRec;
    $('cOverMsg').textContent = NV.fill(g.overMsg);
    $('cSaved').textContent = 'Récord: ' + NV.Best.get('cart');
  }
  function gameOver() {
    if (st === 'over') return;
    st = 'over';
    input.jump = false; input.duck = false;
    g.newRec = NV.Best.offer('cart', g.score);
    g.overMsg = g.newRec ? '¡Eres increíble, {n}! Ese récord es tuyo.' : NV.pick(OVER);
    say('', 0);
    overInfo();
    NV.showPanel(panels, 'over');
    NV.Sound.whine();
  }

  function open() {
    layout();
    reset();
    st = 'menu';
    NV.showPanel(panels, 'menu');
    say('', 0);
    el.best.textContent = NV.Best.get('cart');
    pickBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cchar === who)));
    el.play.disabled = !who;
  }
  function close() { st = 'closed'; input.jump = false; input.duck = false; }
  function start() {
    if (!who) return;
    NV.Sound.ensure();
    layout();
    reset();
    st = 'play';
    NV.showPanel(panels, null);
    say('¡Vámonos, ' + NV.NAME[who] + '! Toca para saltar, y abajo para agacharte', 3);
    NV.Sound.chime();
  }
  function pause() {
    if (st !== 'play') return;
    st = 'pause';
    input.jump = false; input.duck = false;
    NV.showPanel(panels, 'pause');
  }
  function resume() {
    if (st !== 'pause') return;
    st = 'play';
    NV.showPanel(panels, null);
  }

  function jump() {
    g.vy = -JV; g.ground = false; g.coyote = 0; g.jbuf = 0;
    NV.Sound.squeak();
    burst(cxCart(), restTop() + LOG_H, '#F3E3C8', 6);
  }
  function jumpPress() { if (st === 'play') g.jbuf = 0.12; }

  function update(dt) {
    if (g.msgT > 0) { g.msgT -= dt; if (g.msgT <= 0) el.msg.classList.remove('show'); }
    g.t += dt;
    g.speed = Math.min(700, 260 + g.t * 9);
    const mv = g.speed * dt;
    g.dist += mv;
    g.inv -= dt; g.hit -= dt;

    g.nextObs -= mv;
    if (g.nextObs <= 0) { spawnObstacle(); g.nextObs = NV.rand(1.0, 1.6) * g.speed + 140; }
    g.nextItem -= mv;
    if (g.nextItem <= 0) { spawnHearts(); g.nextItem = NV.rand(220, 340); }

    /* Salto con tolerancia: se puede pedir un poco antes y saltar un poco después de la orilla */
    if (g.ground) g.coyote = 0.08; else g.coyote -= dt;
    if (g.jbuf > 0) { g.jbuf -= dt; if (g.ground || g.coyote > 0) jump(); }

    /* Física: gravedad; al agacharse en el aire, cae más rápido, como en el juego del dinosaurio */
    const grav = input.duck && !g.ground ? GRAV * FAST_FALL : GRAV;
    g.vy += grav * dt;
    g.py += g.vy * dt;
    if (g.py >= 0) {
      if (!g.ground && g.vy > 380) { NV.Sound.thud(); burst(cxCart(), restTop() + LOG_H, '#E9D3B0', 6); }
      g.py = 0; g.vy = 0; g.ground = true;
    }
    g.tilt += (NV.clamp(g.vy / 2600, -0.1, 0.1) - g.tilt) * (1 - Math.exp(-10 * dt));

    for (const o of g.obs) o.x -= mv;
    for (const o of g.obs) if (o.k !== 'stump' && o.k !== 'flog') o.ph += dt * 9;
    for (const it of g.items) it.x -= mv;

    if (g.inv <= 0) {
      const b = box();
      for (const o of g.obs) {
        if (!o.dead && NV.overlap(b, hitRect(o))) { o.dead = true; hitPlayer(); break; }
      }
    }
    if (st !== 'play') { updateParts(dt); return; }

    const b = box(), pb = { x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12 };
    for (const it of g.items) {
      if (!it.taken && NV.overlap({ x: it.x - 10, y: it.y - 10, w: 20, h: 20 }, pb)) {
        it.taken = true;
        g.coins++;
        burst(it.x, it.y, '#FFD0E0', 6);
        NV.Sound.pop();
      }
    }
    g.obs = g.obs.filter(o => o.x > -90 && !o.dead);
    g.items = g.items.filter(it => it.x > -40 && !it.taken);

    const sc = Math.floor(g.dist / 10) + g.coins * 15;
    if (sc !== g.score) { g.score = sc; el.score.textContent = sc; }
    if (g.score >= g.milestone) {
      g.milestone += 500;
      say(NV.pick(CHEER), 2);
      NV.Sound.chime();
    }
    const bi = Math.floor(g.score / 400) % 3;
    if (bi !== g.biome) { g.biome = bi; say('¡Ahora es ' + NAMES[bi] + '!', 2.4); NV.Sound.chime(); }
    updateParts(dt);
  }

  function drawObstacle(o) {
    if (o.k === 'low' || o.k === 'mid' || o.k === 'high') {
      /* el pájaro vuela hacia el tronco; se refleja para que mire hacia donde viene */
      ctx.save();
      ctx.translate(o.x + o.w, o.y);
      ctx.scale(-1, 1);
      ctx.drawImage(A.bird(Math.floor(o.ph) % 2), 0, 0, o.w, o.h);
      ctx.restore();
    } else if (o.k === 'flog') {
      ctx.drawImage(A.flog(), o.x, o.y, o.w, o.h);
    } else {
      ctx.drawImage(A.stump(), o.x, o.y, o.w, o.h);
    }
  }

  /* Tronco con una persona encima. Las ruedas van debajo; el personaje se dibuja sobre el tronco. */
  function drawRig() {
    const top = rigTop(), cx = cxCart();
    const duck = input.duck && st === 'play';
    const face = g.hit > 0 ? 'ugh' : g.py < -4 ? 'open' : 'happy';
    const bob = duck || g.py < -2 ? 0 : Math.sin(clk * 6) * 0.5;
    const frame = Math.floor(g.dist / 9);
    for (const wx of [cx - 28, cx + 28]) {
      ctx.drawImage(A.wheel(frame), wx - WHEEL / 2, top + LOG_H + 5 - WHEEL / 2, WHEEL, WHEEL);
    }
    ctx.save();
    ctx.translate(cx, top + LOG_H / 2);
    ctx.rotate(g.tilt);
    ctx.translate(-cx, -(top + LOG_H / 2));
    ctx.drawImage(A.cart(), cartX, top, CART_W, LOG_H);
    A.drawChar(ctx, who || 'marian', face, cx, top + (duck ? FEET_DUCK : FEET_STAND) + bob);
    ctx.restore();
  }

  function draw() {
    if (!fit) return;
    track.render(ctx, { scroll: g.dist || 0, clk });
    for (const o of g.obs) drawObstacle(o);
    const hs = 7 * 2.4;
    for (const it of g.items) {
      const y = it.y + Math.round(Math.sin(clk * 5 + it.ph) * 1.5);
      ctx.drawImage(A.heart(), it.x - hs / 2, y - hs / 2, hs, hs * 6 / 7);
    }
    drawRig();
    drawParts();
  }

  function tick(dt) {
    clk += dt;
    if (fit) track.update(g.biome || 0, fit.W, fit.H, gY, dt);
    if (st === 'play') {
      if (input.jump) jumpPress();
      update(dt);
    }
    draw();
  }

  /* ----- controles ----- */
  const jumpBtn = $('cJump'), duckBtn = $('cDuck');
  jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); jumpPress(); jumpBtn.classList.add('down'); });
  const jumpUp = () => jumpBtn.classList.remove('down');
  jumpBtn.addEventListener('pointerup', jumpUp);
  jumpBtn.addEventListener('pointercancel', jumpUp);
  jumpBtn.addEventListener('pointerleave', jumpUp);
  duckBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (st === 'play') input.duck = true;
    duckBtn.classList.add('down');
    try { duckBtn.setPointerCapture(e.pointerId); } catch (err) {}
  });
  const duckUp = () => { input.duck = false; duckBtn.classList.remove('down'); };
  duckBtn.addEventListener('pointerup', duckUp);
  duckBtn.addEventListener('pointercancel', duckUp);
  duckBtn.addEventListener('lostpointercapture', duckUp);
  /* Tocar en cualquier parte de la pantalla también salta, como en el juego del dinosaurio */
  root.addEventListener('pointerdown', e => {
    if (st === 'play' && !e.target.closest('.ctrl, .panel, .homeBtn, .pillBtn')) jumpPress();
  });
  el.play.addEventListener('click', start);
  $('cAgain').addEventListener('click', start);
  $('cResume').addEventListener('click', resume);
  $('cPauseBtn').addEventListener('click', pause);

  reset();
  NV.Cart = {
    open, close, tick, resize: () => { if (st !== 'closed') layout(); },
    pauseIfPlaying: pause,
    key(code, down, e) {
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
        if (e) e.preventDefault();
        if (!down) { input.jump = false; return; }
        if (e && e.repeat) return;
        if (st === 'play') { jumpPress(); input.jump = true; }
        else if (st === 'over') start();
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        if (e) e.preventDefault();
        input.duck = down && st === 'play';
      } else if (down && (code === 'Escape' || code === 'KeyP')) {
        if (st === 'play') pause(); else if (st === 'pause') resume();
      }
    },
  };
})();
