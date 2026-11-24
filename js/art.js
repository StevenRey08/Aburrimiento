/* Pixel art propio. Cada dibujo sale de una máscara, así que cada pixel cae en su lugar.
   Marian y Rey son personajes originales en el estilo de las mascotas de las imágenes. */
(() => {
  'use strict';
  const NV = (window.NV = window.NV || {});
  const PX = NV.PX;

  NV.mk = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  };
  const K = (x, y) => x + ',' + y;
  const SET = list => new Set(list.map(([x, y]) => K(x, y)));
  const inEll = (x, y, e) => { const dx = (x + 0.5 - e[0]) / e[2], dy = (y + 0.5 - e[1]) / e[3]; return dx * dx + dy * dy <= 1; };
  const inCirc = (x, y, cx, cy, r) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy; return dx * dx + dy * dy <= r * r; };

  /* Pinta una cuadrícula: colorAt(x, y) devuelve un color o null. outline añade un borde de 1 pixel. */
  function paint(w, h, colorAt, outline) {
    const grid = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) row.push(colorAt(x, y) || null);
      grid.push(row);
    }
    const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? grid[y][x] : null);
    const c = NV.mk(w, h), g = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let col = grid[y][x];
        if (!col && outline) {
          search: for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (at(x + dx, y + dy)) { col = outline; break search; }
          }
        }
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    }
    return c;
  }
  const gridArt = (rows, pal, outline) => paint(rows[0].length, rows.length, (x, y) => pal[rows[y][x]] || null, outline);
  const memo = (k, f) => cache[k] || (cache[k] = f());
  const cache = {};
  const urls = new WeakMap();

  /* ---------- personajes ---------- */
  /* Accesorios dibujados pixel a pixel. Cada uno devuelve un color o null.
     El lacito va a la derecha de la cabeza; la coronita va encima, con su tercera punta y sus gemas. */
  /* El lazo va atado al costado derecho de la cabeza, donde se une con la oreja: el nudo cae sobre el contorno. */
  function bow(x, y) {
    const cx = x + 0.5, cy = y + 0.5;
    if (Math.hypot(cx - 28, cy - 11) <= 1.1) return '#D9457F';
    if (pointIn([[28, 11], [24.5, 8], [24.5, 14]], cx, cy)) return '#FF7FB0';
    if (pointIn([[28, 11], [31.5, 8], [31.5, 14]], cx, cy)) return '#FF7FB0';
    return null;
  }
  /* Coronita chiquita para Marian: se apoya en la parte de arriba de la cabeza, sin tapar sus lados. */
  const CROWN_M_ROWS = ['...YY...', 'Y..YY..Y', 'YYYYYYYY', 'GGGPPGGG', 'GGGGGGGG', 'DDDDDDDD'];
  const CROWN_M_PAL = { Y: '#FFD35C', G: '#FFD35C', D: '#E0A93A', P: '#EF5D8B' };
  function crownMarian(x, y) {
    const r = y - 1, c = x - 16;
    if (r < 0 || r >= CROWN_M_ROWS.length || c < 0 || c >= 8) return null;
    return CROWN_M_PAL[CROWN_M_ROWS[r][c]] || null;
  }
  function crownAt(b) {
    const X = 20, TIPS = [
      [[X - 6.5, b + 0.3], [X - 6, b - 3], [X - 3.2, b + 0.3]],
      [[X - 2.6, b + 0.3], [X, b - 4.5], [X + 2.6, b + 0.3]],
      [[X + 3.2, b + 0.3], [X + 6, b - 3], [X + 6.5, b + 0.3]],
    ];
    return (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (cy >= b && cy < b + 3 && Math.abs(cx - X) <= 6.5) {
        const gy = b + 1.5;
        if (Math.hypot(cx - X, cy - gy) <= 1) return '#EF5D8B';
        if (Math.hypot(cx - (X - 5), cy - gy) <= 0.9 || Math.hypot(cx - (X + 5), cy - gy) <= 0.9) return '#7FD3FF';
        return cy >= b + 2 ? '#E0A93A' : '#FFD35C';
      }
      return TIPS.some(t => pointIn(t, cx, cy)) ? '#FFD35C' : null;
    };
  }
  const CROWN_REY = crownAt(7);

  /* Marian: lacito y coronita. Rey: solo coronita. Los dos tienen pies redondos. */
  const CHAR = {
    marian: {
      body: '#FFFFFF', shade: '#D3E7FB', line: '#7FA9D6', cheek: '#FF9FBA', eye: '#243656',
      shapes: [[20, 23, 14, 11], [11, 17, 6.5, 6.5], [20, 12, 8, 8], [29, 17, 6.5, 6.5], [12, 34, 3, 2], [26, 34, 3, 2]],
      deco: (x, y) => bow(x, y) || crownMarian(x, y),
    },
    rey: {
      body: '#FFE7A0', shade: '#EFC15A', line: '#A87532', cheek: '#F4957F', eye: '#3A2716',
      shapes: [[20, 22, 15, 14], [13.5, 35.5, 3.2, 3.2], [26.5, 35.5, 3.2, 3.2]],
      deco: CROWN_REY,
    },
  };
  const FACE = {
    open: {
      eye: [[13, 20], [14, 20], [13, 21], [14, 21], [25, 20], [26, 20], [25, 21], [26, 21]],
      mouth: [[19, 26], [20, 26], [19, 27], [20, 27]],
    },
    happy: {
      eye: [[12, 21], [13, 20], [14, 20], [15, 21], [24, 21], [25, 20], [26, 20], [27, 21]],
      mouth: [[16, 25], [17, 26], [18, 26], [19, 27], [20, 27], [21, 26], [22, 26], [23, 25]],
    },
    ugh: {
      eye: [[13, 20], [14, 20], [13, 21], [14, 21], [25, 20], [26, 20], [25, 21], [26, 21]],
      brow: [[12, 17], [13, 18], [14, 18], [27, 17], [26, 18], [25, 18]],
      mouth: [[17, 26], [18, 27], [19, 26], [20, 26], [21, 27], [22, 26]],
    },
    sleep: {
      eye: [[12, 21], [13, 21], [14, 21], [25, 21], [26, 21], [27, 21]],
      mouth: [[19, 27], [20, 27]],
    },
  };
  const CHEEKS = SET([[9, 24], [10, 24], [29, 24], [30, 24]]);
  function character(kind, face) {
    const P = CHAR[kind], F = FACE[face];
    const feat = SET([...F.eye, ...(F.brow || []), ...F.mouth]);
    return paint(40, 40, (x, y) => {
      const d = P.deco(x, y);
      if (d) return d;
      if (!P.shapes.some(e => inEll(x, y, e))) return null;
      const k = K(x, y);
      if (feat.has(k)) return P.eye;
      if (CHEEKS.has(k)) return P.cheek;
      return y >= 28 ? P.shade : P.body;
    }, P.line);
  }

  /* ---------- comida ---------- */
  const SEEDS = SET([[5, 9], [9, 9], [7, 11], [10, 12], [6, 13], [8, 7]]);
  function strawberry() {
    return paint(16, 16, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (y === 2 && Math.abs(cx - 8) <= 1.5) return '#3E8048';
      if (y === 3 && Math.abs(cx - 8) <= 4.2) return '#5DBB63';
      if (y === 4 && Math.abs(cx - 8) <= 3.4) return '#4FA65A';
      if (y < 5 || y > 14) return null;
      const w = 5.8 * (1 - Math.max(0, (cy - 6) / 9));
      if (Math.abs(cx - 8) > w) return null;
      if (SEEDS.has(K(x, y))) return '#FFE9EE';
      if (y === 7 && (x === 5 || x === 6)) return '#FF9AA8';
      return '#E84D5F';
    }, '#7A2236');
  }
  function cookie() {
    const CHIPS = SET([[5, 5], [10, 4], [11, 9], [6, 11], [9, 12], [4, 9]]);
    return paint(16, 16, (x, y) => {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 8, d2 = dx * dx + dy * dy;
      if (d2 > 49) return null;
      if (CHIPS.has(K(x, y))) return '#5C3A1E';
      return d2 > 30 ? '#C48A4B' : '#E0AD6E';
    }, '#8A5A2B');
  }
  function donut() {
    const SPRINK = { '4,6': '#FFE08A', '11,5': '#8AC0E6', '12,10': '#C9B6F5', '5,11': '#FFFFFF', '9,13': '#FFE08A', '3,10': '#FFFFFF' };
    return paint(16, 16, (x, y) => {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 8, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 7 || d < 2.4) return null;
      const s = SPRINK[K(x, y)];
      if (s) return s;
      return d > 5 ? '#E7B070' : '#F7A6C4';
    }, '#9C6A34');
  }
  function apple() {
    return paint(16, 16, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if ((x === 8 && (y === 2 || y === 3))) return '#6B4A2A';
      if ((x === 9 && y === 2) || (x === 10 && (y === 2 || y === 3)) || (x === 11 && y === 2)) return '#5DBB63';
      const inside = ((cx - 8) / 6.2) ** 2 + ((cy - 9.6) / 5.6) ** 2 <= 1;
      if (!inside) return null;
      if ((x === 4 && (y === 8 || y === 9)) || (x === 5 && y === 7)) return '#FFB5AE';
      return cy > 12.5 ? '#C23A36' : '#E24B45';
    }, '#7A2A25');
  }
  function broccoli() {
    const puffs = [[4.5, 6.5, 3.2], [8, 4.6, 3.6], [11.5, 6.5, 3.2], [6.5, 9.2, 3.2], [9.5, 9.2, 3.2]];
    return paint(16, 16, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (x >= 6 && x <= 9 && y >= 11 && y <= 15) return x === 6 ? '#8FBF7A' : '#A8D08D';
      if (!puffs.some(([px, py, r]) => (cx - px) ** 2 + (cy - py) ** 2 <= r * r)) return null;
      return cy < 5.5 ? '#7FC474' : '#5C9E55';
    }, '#345E30');
  }
  const FOODS = { strawberry, cookie, donut, apple, broccoli };

  /* ---------- objetos ---------- */
  function pointIn(poly, x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function starArt() {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const R = i % 2 === 0 ? 5.4 : 2.6, a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push([5.5 + Math.cos(a) * R, 5.6 + Math.sin(a) * R]);
    }
    return paint(11, 11, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (!pointIn(pts, cx, cy)) return null;
      return Math.hypot(cx - 5.5, cy - 5.6) < 1.7 ? '#FFF6CF' : '#FFD65E';
    }, '#D99A2B');
  }
  function bubbleArt() {
    const RB = ['#FF9AB8', '#FFE08A', '#C5EDD1', '#8AC0E6', '#C9B6F5'];
    return paint(14, 14, (x, y) => {
      const dx = x + 0.5 - 7, dy = y + 0.5 - 7, d = Math.hypot(dx, dy);
      if (d > 6.6) return null;
      if (d >= 5) {
        const a = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2);
        return RB[Math.floor(a * RB.length) % RB.length];
      }
      if ((x === 3 && (y === 3 || y === 4)) || (x === 4 && y === 3)) return '#FFFFFF';
      return 'rgba(255,255,255,0.55)';
    }, '#B9A5E3');
  }
  function stormArt() {
    const S = [[16, 25, 11], [31, 19, 15], [47, 24, 12], [24, 29, 9], [40, 29, 9]];
    const DARK = SET([
      [24, 21], [25, 21], [24, 22], [25, 22], [38, 21], [39, 21], [38, 22], [39, 22],
      [22, 17], [23, 18], [24, 18], [25, 19], [41, 17], [40, 18], [39, 18], [38, 19],
      [27, 26], [28, 27], [29, 28], [30, 28], [33, 28], [34, 28], [35, 27], [36, 26],
    ]);
    const BLUSH = SET([[20, 25], [21, 25], [42, 25], [43, 25]]);
    return paint(64, 40, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (!S.some(c => inCirc(x, y, c[0], c[1], c[2]))) return null;
      const k = K(x, y);
      if (DARK.has(k)) return '#2B3550';
      if (BLUSH.has(k)) return '#FF9AB8';
      return cy >= 30 ? '#AEBBD3' : '#DCE4F1';
    }, '#6E7B98');
  }
  const BOLT = ['....YY.', '...YY..', '..YY...', '.YYYYY.', '....YY.', '...YY..', '..Y....'];
  const boltArt = () => gridArt(BOLT, { Y: '#FFE66B' }, '#C9A227');
  const HEART = ['.RR.RR.', 'RHRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];
  const heartArt = () => gridArt(HEART, { R: '#EF6F8E', H: '#FFC2D1' }, '#A34A62');

  function cloudArt(seed, pal) {
    const C = [
      [[16, 18, 11], [32, 14, 13], [47, 19, 10], [24, 22, 8], [40, 22, 8]],
      [[14, 19, 9], [26, 14, 11], [40, 13, 12], [52, 20, 9], [30, 21, 9]],
      [[18, 19, 10], [34, 16, 12], [48, 20, 8], [10, 22, 6], [56, 22, 6]],
    ][seed % 3];
    return paint(64, 32, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      const inside = C.some(c => inCirc(x, y, c[0], c[1], c[2])) || (cy >= 19 && cy <= 27 && cx >= 10 && cx <= 54);
      if (!inside) return null;
      return cy >= 23 ? pal.shade : pal.body;
    }, pal.line);
  }
  function rockArt() {
    return paint(14, 11, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (((cx - 7) / 6.6) ** 2 + ((cy - 7.5) / 5.2) ** 2 > 1) return null;
      if (y <= 4 && (x === 4 || x === 5)) return '#EFE4D3';
      return cy > 8.5 ? '#9C8269' : '#BCA586';
    }, '#5E4B39');
  }
  function birdArt(f) {
    return paint(14, 10, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (((cx - 6.5) / 4.8) ** 2 + ((cy - 5) / 2.6) ** 2 <= 1) return (x === 9 && y === 4) ? '#2F5BAE' : '#FFFFFF';
      if (x >= 12 && x <= 13 && (y === 4 || y === 5)) return '#F7B26B';
      if (f === 0 && y <= 2 && Math.abs(x - 6) <= 3 - y) return '#FFFFFF';
      if (f === 1 && y >= 7 && Math.abs(x - 6) <= y - 6) return '#FFFFFF';
      return null;
    }, '#8DB0D8');
  }
  function wheelArt(f) {
    const th = (f * Math.PI) / 8;
    return paint(16, 16, (x, y) => {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 8, r = Math.hypot(dx, dy);
      if (r > 6.9) return null;
      if (r <= 1.3) return '#F3D9A4';
      const a = Math.atan2(dy, dx);
      const spoke = r <= 5.6 && (Math.abs(Math.sin(a - th)) * r < 0.65 || Math.abs(Math.sin(a - th - Math.PI / 2)) * r < 0.65);
      return spoke ? '#F3D9A4' : '#5A3B22';
    }, '#2E1C10');
  }
  /* Tronco: corteza, flores rosas arriba y anillos en la punta de adelante.
     Sirve para el vehículo del paseo y para el tronco caído del camino. */
  function logArt(W, H) {
    const ry = H / 2 - 1.5, rx = ry * 0.78, ecx = W - rx - 1, ecy = H / 2;
    const FLOW = SET([[Math.round(W * 0.2), 2], [Math.round(W * 0.5), 3], [Math.round(W * 0.8), 2]]);
    const KNOT = SET([[Math.round(W * 0.35), Math.round(H * 0.62)], [Math.round(W * 0.66), Math.round(H * 0.72)]]);
    return paint(W, H, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      const ex = (cx - ecx) / rx, ey = (cy - ecy) / ry, d = Math.sqrt(ex * ex + ey * ey);
      if (d <= 1) return d < 0.3 ? '#B9782F' : Math.floor(d * 5) % 2 ? '#E9C58C' : '#D9A866';
      if (cx > ecx || cy < 1 || cy > H - 1) return null;
      const k = K(x, y);
      if (FLOW.has(k)) return '#FF9DBB';
      if (KNOT.has(k)) return '#4E3218';
      if (cy < 4) return '#B07A45';
      if (cy > H - 4) return '#6B4426';
      return x % 9 === 0 ? '#5E3A1F' : '#8B5A32';
    }, '#3A2415');
  }
  /* Tocón para saltar: tapa con anillos y corteza abajo. */
  function stumpArt() {
    return paint(28, 20, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      const te = ((cx - 14) / 12.5) ** 2 + ((cy - 6) / 4.5) ** 2;
      if (te <= 1) return te < 0.09 ? '#B9782F' : Math.floor(Math.sqrt(te) * 4) % 2 ? '#E9C58C' : '#D9A866';
      if (cx < 2 || cx > 26 || cy < 6 || cy > 19.5) return null;
      return cy > 16 ? '#6B4426' : x % 7 === 3 ? '#5E3A1F' : '#8B5A32';
    }, '#3A2415');
  }
  function logIcon() {
    return paint(16, 16, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      const ex = (cx - 12) / 3.6, ey = (cy - 8) / 4.8, d = Math.sqrt(ex * ex + ey * ey);
      if (d <= 1) return d < 0.35 ? '#B9782F' : Math.floor(d * 4) % 2 ? '#E9C58C' : '#D9A866';
      if (cx > 12 || cy < 4.5 || cy > 11.5) return null;
      if (cy < 6) return '#B07A45';
      return x % 4 === 1 ? '#5E3A1F' : '#8B5A32';
    }, '#3A2415');
  }

  const ICONS = {
    comida: () => strawberry(),
    carrito: () => logIcon(),
    vuelo: () => {
      const c = NV.mk(16, 16), g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(character('marian', 'happy'), 0, 0, 16, 16);
      return c;
    },
  };

  NV.Art = {
    char: (kind, face) => memo('c' + kind + face, () => character(kind, face)),
    /* Dibuja un personaje con los pies en feetY y centrado en cx. k escala el personaje. */
    drawChar(ctx, kind, face, cx, feetY, k = 1) {
      const S = 40 * PX * k;
      ctx.drawImage(NV.Art.char(kind, face), cx - S / 2, feetY - 37.5 * PX * k, S, S);
    },
    food: name => memo('f' + name, FOODS[name]),
    icon: name => memo('i' + name, ICONS[name]),
    star: () => memo('star', starArt),
    bubble: () => memo('bubble', bubbleArt),
    storm: () => memo('storm', stormArt),
    bolt: () => memo('bolt', boltArt),
    heart: () => memo('heart', heartArt),
    cloud: (seed, pal) => memo('cl' + seed + pal.body, () => cloudArt(seed, pal)),
    rock: () => memo('rock', rockArt),
    bird: f => memo('bird' + (f % 2), () => birdArt(f % 2)),
    wheel: f => memo('wheel' + (f % 4), () => wheelArt(f % 4)),
    cart: () => memo('cart', () => logArt(60, 19)),
    flog: () => memo('flog', () => logArt(28, 9)),
    stump: () => memo('stump', stumpArt),
    dataURL(c) {
      if (!urls.has(c)) urls.set(c, c.toDataURL());
      return urls.get(c);
    },
  };
})();
