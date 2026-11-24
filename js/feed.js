/* Hora de comer: Marian o Rey atrapan la comida con su plato. Se mueven a los lados y saltan para alcanzar la comida que cae más alto. */
(() => {
  'use strict';
  const NV = window.NV, $ = NV.$, A = NV.Art, PX = NV.PX;
  const root = $('feed'), cv = $('fc'), ctx = cv.getContext('2d');
  const el = {
    score: $('fScore'), lives: $('fLives'), msg: $('fMsg'), combo: $('fCombo'),
    pick: $('fPick'), over: $('fOver'), go: $('fGo'),
  };
  const pickBtns = root.querySelectorAll('[data-char]');
  const padBtns = root.querySelectorAll('[data-dir]');
  const GOOD = ['strawberry', 'cookie', 'donut', 'apple'];
  const LINES = ['Qué bien comiste, {n}.', '¿Otra ronda para subir el puntaje?', 'Casi lo logras. ¡Otra vez!'];
  const BITE = ['¡Ñam!', '¡Qué rico!'];
  const BIOME_MSG = ['', '¡Ya llegó el atardecer!', '¡Ya es de noche, qué bonito!'];
  const PAD_PX = 92, BLANKET = 70, JUMP_V = 640, GRAV = 1500;
  const track = NV.Scene.track(false);
  const pad = { left: false, right: false };
  let fit = null, BASE = 0, blanket = null, sel = null, char = 'marian', clk = 0, st = 'closed';
  let g = {};

  const mult = () => (g.combo >= 10 ? 3 : g.combo >= 5 ? 2 : 1);
  /* El plato se queda quieto en la mesa. Quien salta es el personaje, y con él sube la zona donde atrapa la comida. */
  const plateY = () => BASE - 8;
  const charY = () => plateY() - 8 - g.jh;
  const catchY = () => BASE - 62 - g.jh;
  const missY = () => BASE + 14;
  const groundY = () => BASE - 22;

  function blanketArt(W) {
    const AW = Math.ceil(W / PX) + 1, AH = Math.ceil(BLANKET / PX) + 1;
    const c = NV.mk(AW, AH), b = c.getContext('2d');
    for (let y = 0; y < AH; y++) {
      for (let x = 0; x < AW; x++) {
        b.fillStyle = ((x >> 2) + (y >> 2)) % 2 ? '#F4B3C8' : '#FFF6F9';
        b.fillRect(x, y, 1, 1);
      }
    }
    b.fillStyle = '#E58FAB';
    b.fillRect(0, 0, AW, 1);
    return c;
  }
  function layout() {
    fit = NV.fitWorld(root, cv, ctx);
    BASE = fit.H - PAD_PX / fit.s; /* deja libre abajo la franja de flechas */
    blanket = blanketArt(fit.W);
  }

  function say(text, sec) {
    if (!text) { el.msg.classList.remove('show'); g.msgT = 0; return; }
    el.msg.textContent = NV.fill(text);
    el.msg.classList.add('show');
    g.msgT = sec || 2;
  }
  function setHud() {
    el.score.textContent = g.score;
    el.combo.textContent = g.combo >= 3 ? 'Racha x' + mult() : '';
  }
  function reset() {
    g = {
      score: 0, lives: 3, combo: 0, t: 0, spawnT: 0.8, dist: 0,
      px: fit ? fit.W / 2 : 180, target: fit ? fit.W / 2 : 180,
      jh: 0, jv: 0, jbuf: 0,
      items: [], pops: [], hurt: 0, eat: 0, msgT: 0, newRec: false, overMsg: '', biome: 0,
    };
    NV.hearts(el.lives, 3);
    setHud();
  }
  function overInfo() {
    $('fOverTitle').textContent = g.newRec ? '¡Récord nuevo!' : '¡Qué rico!';
    $('fFinal').textContent = g.score;
    $('fNew').hidden = !g.newRec;
    $('fOverMsg').textContent = NV.fill(g.overMsg);
    $('fSaved').textContent = 'Récord: ' + NV.Best.get('feed');
  }
  function select(k) {
    sel = k;
    el.go.disabled = false;
    pickBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.char === k)));
  }
  function resetPad() { pad.left = false; pad.right = false; }
  function open() {
    layout();
    reset();
    st = 'pick';
    resetPad();
    el.pick.hidden = false;
    el.over.hidden = true;
    say('', 0);
    sel = null;
    el.go.disabled = true;
    pickBtns.forEach(b => b.setAttribute('aria-pressed', 'false'));
  }
  function close() { st = 'closed'; resetPad(); }
  function start() {
    if (!sel) return;
    NV.Sound.ensure();
    layout();
    reset();
    char = sel;
    st = 'play';
    resetPad();
    el.pick.hidden = true;
    el.over.hidden = true;
    say('¡A comer, ' + NV.NAME[char] + '! Usa las flechas para moverte y saltar', 3);
  }
  function gameOver() {
    if (st === 'over') return;
    st = 'over';
    resetPad();
    g.combo = 0;
    say('', 0);
    g.newRec = NV.Best.offer('feed', g.score);
    g.overMsg = g.newRec ? '¡Eres increíble, {n}! Ese récord es tuyo.' : NV.pick(LINES);
    setHud();
    overInfo();
    el.over.hidden = false;
    NV.Sound.whine();
  }

  function spawn() {
    const bad = g.t > 5 && Math.random() < 0.16;
    g.items.push({ name: bad ? 'broccoli' : NV.pick(GOOD), bad, x: NV.rand(40, fit.W - 40), y: -30, done: false });
  }
  function caught(it) {
    if (it.bad) {
      g.lives--; g.combo = 0; g.hurt = 0.7;
      NV.Sound.whine(); NV.buzz(40);
      g.pops.push({ x: it.x, y: charY() - 60, text: '¡Puaj!', t: 0 });
      say('¡Puaj! Eso no, no me gusta el brócoli', 1.6);
      NV.hearts(el.lives, g.lives);
      setHud();
      if (g.lives <= 0) gameOver();
      return;
    }
    const pts = mult();
    g.combo++; g.score += pts; g.eat = 0.22;
    NV.Sound.nom(); NV.buzz(8);
    g.pops.push({ x: it.x, y: charY() - 60, text: '+' + pts, t: 0 });
    if (Math.random() < 0.08) say(NV.pick(BITE), 1);
    setHud();
  }
  function missed(it) {
    if (it.bad) return;
    g.lives--; g.combo = 0; g.hurt = 0.6;
    NV.Sound.thud(); NV.buzz(20);
    say('¡Ay, se me cayó!', 1.3);
    NV.hearts(el.lives, g.lives);
    setHud();
    if (g.lives <= 0) gameOver();
  }

  function update(dt) {
    g.t += dt;
    g.dist += dt * 6;
    const dir = (pad.right ? 1 : 0) - (pad.left ? 1 : 0);
    if (dir) g.target = NV.clamp(g.target + dir * 430 * dt, 60, fit.W - 60);
    g.px += (g.target - g.px) * (1 - Math.exp(-12 * dt));

    /* Salto del personaje (el plato no se mueve). */
    if (g.jbuf > 0) {
      g.jbuf -= dt;
      if (g.jh <= 0 && g.jv <= 0) { g.jv = JUMP_V; g.jbuf = 0; NV.Sound.squeak(); }
    }
    if (g.jh > 0 || g.jv > 0) {
      g.jv -= GRAV * dt;
      g.jh += g.jv * dt;
      if (g.jh <= 0) { g.jh = 0; g.jv = 0; }
    }

    const v = Math.min(640, 150 + g.t * 8.5);
    g.spawnT -= dt;
    if (g.spawnT <= 0) {
      spawn();
      g.spawnT = Math.max(0.42, 1.2 - g.t * 0.012) * NV.rand(0.85, 1.15);
    }
    for (const it of g.items) {
      if (it.done) continue;
      it.y += v * dt;
      if (it.y >= catchY() && Math.abs(it.x - g.px) < 58) { it.done = true; caught(it); }
      else if (it.y >= missY()) { it.done = true; missed(it); }
      if (st !== 'play') break;
    }
    g.items = g.items.filter(it => !it.done);
    for (const p of g.pops) { p.t += dt; p.y -= 40 * dt; }
    g.pops = g.pops.filter(p => p.t < 0.9);
    g.hurt -= dt; g.eat -= dt; g.msgT -= dt;
    if (g.msgT <= 0) el.msg.classList.remove('show');

    const bi = g.score >= 30 ? 2 : g.score >= 12 ? 1 : 0;
    if (bi !== g.biome) { g.biome = bi; say(BIOME_MSG[bi], 2.2); }
  }

  function drawPlate() {
    const y = plateY(), x = g.px;
    /* sombra en el plato: se hace más chica mientras el personaje está en el aire */
    const lift = NV.clamp(g.jh / 180, 0, 1);
    ctx.fillStyle = 'rgba(90,60,30,' + (0.18 - lift * 0.08).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(x, y + 9, 56 - lift * 14, 10 - lift * 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E4DCD3';
    ctx.beginPath(); ctx.ellipse(x, y + 4, 52, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(x, y, 50, 10, 0, 0, Math.PI * 2); ctx.fill();
  }
  function draw() {
    if (!fit) return;
    track.render(ctx, { scroll: g.dist, clk });
    ctx.drawImage(blanket, 0, BASE - 22, blanket.width * PX, blanket.height * PX);
    drawPlate();
    const s = 16 * PX;
    for (const it of g.items) ctx.drawImage(A.food(it.name), it.x - s / 2, it.y - s / 2, s, s);
    if (st === 'play' || st === 'over' || st === 'paused') {
      const face = g.hurt > 0 ? 'ugh' : g.jh > 0 ? 'open' : g.eat > 0 ? 'open' : 'happy';
      const bob = Math.round(Math.sin(clk * 3) * 2) / 2;
      A.drawChar(ctx, char, face, g.px, charY() + bob);
    }
    ctx.font = '700 22px Fredoka, system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const p of g.pops) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / 0.9);
      ctx.fillStyle = '#4E3520';
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';
  }

  function tick(dt) {
    clk += dt;
    if (fit) track.update(g.biome || 0, fit.W, fit.H, groundY(), dt);
    if (st === 'play') update(dt);
    draw();
  }

  function jumpPress() { if (st === 'play') g.jbuf = 0.14; }
  function key(code, down, e) {
    if (code === 'ArrowLeft' || code === 'KeyA') pad.left = down;
    else if (code === 'ArrowRight' || code === 'KeyD') pad.right = down;
    else if (code === 'ArrowUp' || code === 'KeyW' || code === 'Space') {
      if (e) e.preventDefault();
      if (down && !(e && e.repeat)) jumpPress();
      return;
    } else return;
    if (e) e.preventDefault();
  }

  pickBtns.forEach(b => b.addEventListener('click', () => select(b.dataset.char)));
  el.go.addEventListener('click', start);
  $('fAgain').addEventListener('click', () => { sel = char; start(); });
  $('fChange').addEventListener('click', () => {
    st = 'pick';
    el.over.hidden = true;
    el.pick.hidden = false;
    select(char);
  });
  /* Flechas de la pantalla: izquierda y derecha se mantienen presionadas; el centro salta. */
  padBtns.forEach(b => {
    const dir = b.dataset.dir;
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (st !== 'play') return;
      if (dir === 'up') jumpPress();
      else if (dir === 'left') pad.left = true;
      else if (dir === 'right') pad.right = true;
      b.classList.add('down');
      try { b.setPointerCapture(e.pointerId); } catch (err) {}
    });
    const off = () => {
      if (dir === 'left') pad.left = false;
      else if (dir === 'right') pad.right = false;
      b.classList.remove('down');
    };
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('lostpointercapture', off);
  });
  root.querySelectorAll('[data-art]').forEach(im => { im.src = NV.Art.dataURL(A.char(im.dataset.art, 'happy')); });

  NV.Feed = {
    open, close, tick,
    resize: () => { if (st !== 'closed') layout(); },
    key,
    pauseIfPlaying: () => { if (st === 'play') st = 'paused'; resetPad(); },
    resumeIfPaused: () => { if (st === 'paused') st = 'play'; },
  };
})();
