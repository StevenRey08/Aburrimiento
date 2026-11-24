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
  const inRotEll = (x, y, cx, cy, rx, ry, ang) => {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const c = Math.cos(ang), s = Math.sin(ang);
    const u = dx * c + dy * s, v = -dx * s + dy * c;
    return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1;
  };
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
  /* Lazo rosado con volumen atado a la oreja derecha de Marian. */
  const BOW_ROWS = [
    '..oo...oo..',
    '.oHPo.oPHo.',
    '.oPPoooPPo.',
    '.oPDoKooPo.',
    '.oPDoKooDo.',
    '..oo...oo..',
  ];
  const BOW_PAL = { o: '#9D2D59', H: '#FFC2D9', P: '#FF7FB0', D: '#EA5690', K: '#C9346E' };
  function bow(x, y) {
    const r = y - 7, c = x - 24;
    if (r < 0 || r >= BOW_ROWS.length || c < 0 || c >= BOW_ROWS[0].length) return null;
    return BOW_PAL[BOW_ROWS[r][c]] || null;
  }
  /* Coronita de Marian con brillo, sombra y gema rosada. */
  const CROWN_M_ROWS = [
    '....oo....',
    '.oo.oYo.oo',
    'oYo.oHo.oY',
    'oYYoYYYoYY',
    'oGGGPGGGGo',
    '.oDDDDDDo.',
  ];
  const CROWN_M_PAL = { o: '#9E681B', H: '#FFF1A6', Y: '#FFD863', G: '#F6BE42', D: '#D89726', P: '#FF4F87' };
  function crownMarian(x, y) {
    const r = y - 1, c = x - 15;
    if (r < 0 || r >= CROWN_M_ROWS.length || c < 0 || c >= CROWN_M_ROWS[0].length) return null;
    return CROWN_M_PAL[CROWN_M_ROWS[r][c]] || null;
  }
  /* Corona real de Rey con puntas perfiladas y tres gemas. */
  const CROWN_R_ROWS = [
    '......ooo......',
    '.oo...oHo...oo.',
    'oYHo.oYYYo.oHYo',
    'oYYYoYYYYYoYYYo',
    'oYYBYYPPPYYBYYo',
    'oGGGGGGGGGGGGGo',
    '.oDDDDDDDDDDDo.',
  ];
  const CROWN_R_PAL = { o: '#9E681B', H: '#FFF2AD', Y: '#FFD863', G: '#F6BE42', D: '#D89726', P: '#FF4F87', B: '#73D2FF' };
  function crownRey(x, y) {
    const r = y - 2, c = x - 12;
    if (r < 0 || r >= CROWN_R_ROWS.length || c < 0 || c >= CROWN_R_ROWS[0].length) return null;
    return CROWN_R_PAL[CROWN_R_ROWS[r][c]] || null;
  }

  /* Marian: orejas suaves, manitos y lazo; Rey: redondito dorado con corona real. */
  const CHAR = {
    marian: {
      body: '#FFFFFF', hi: '#FFFFFF', shade: '#D6E9FC', earShade: '#C7DFF8', line: '#6F98C9',
      cheek: '#FF9AB8', eye: '#243656', tongue: '#FF7FA4',
      shapes: [
        [20, 15, 9.2, 7.8], [20, 26, 10.2, 8.6],
        [9.5, 16.5, 4.3, 6.8], [30.5, 16.5, 4.3, 6.8],
        [12.5, 25.5, 2.8, 2.3], [27.5, 25.5, 2.8, 2.3],
        [14.5, 34.5, 3.2, 2.2], [25.5, 34.5, 3.2, 2.2],
      ],
      headCy: 15, headRy: 7.8,
      ey: 16, my: 19, cy: 19,
      deco: (x, y) => bow(x, y) || crownMarian(x, y),
      detail(x, y) {
        if ((x === 12 || x === 27) && y >= 13 && y <= 17) return '#9BBCE3';
        if ((x < 12 || x > 27) && y >= 19) return '#C7DFF8';
        return null;
      },
    },
    rey: {
      body: '#FFE496', hi: '#FFF3C4', shade: '#ECC056', earShade: '#ECC056', line: '#9E6A28',
      cheek: '#F6917B', eye: '#3A2716', tongue: '#FF849D',
      shapes: [
        [20, 21.5, 13.5, 12.8],
        [8.2, 24.5, 2.6, 3.0], [31.8, 24.5, 2.6, 3.0],
        [14, 34.5, 3.3, 2.4], [26, 34.5, 3.3, 2.4],
      ],
      headCy: 17, headRy: 9,
      ey: 18, my: 21, cy: 21,
      deco: crownRey,
      detail(x, y) {
        if (Math.hypot(x + 0.5 - 16, y + 0.5 - 13) <= 3.2) return '#FFF3C4';
        if (y >= 26 && Math.hypot(x + 0.5 - 20, y + 0.5 - 27) <= 5.5) return '#FFF1BC';
        return null;
      },
    },
  };
  function faceMaps(P) {
    const ey = P.ey, my = P.my, cy = P.cy;
    return {
      cheeks: SET([
        [11, cy], [12, cy], [11, cy + 1], [12, cy + 1],
        [27, cy], [28, cy], [27, cy + 1], [28, cy + 1],
      ]),
      open: {
        eye: [[14, ey], [15, ey], [14, ey + 1], [15, ey + 1], [24, ey], [25, ey], [24, ey + 1], [25, ey + 1]],
        glint: [[14, ey], [24, ey]],
        mouth: [[19, my], [20, my], [19, my + 1], [20, my + 1]],
        tongue: [[19, my + 1], [20, my + 1]],
      },
      happy: {
        eye: [[13, ey + 1], [14, ey], [15, ey], [16, ey + 1], [23, ey + 1], [24, ey], [25, ey], [26, ey + 1]],
        glint: [],
        mouth: [[17, my], [18, my + 1], [19, my], [20, my], [21, my + 1], [22, my]],
        tongue: [],
      },
      ugh: {
        eye: [[14, ey], [15, ey], [14, ey + 1], [15, ey + 1], [24, ey], [25, ey], [24, ey + 1], [25, ey + 1]],
        glint: [[14, ey], [24, ey]],
        brow: [[13, ey - 2], [14, ey - 1], [15, ey - 1], [26, ey - 2], [25, ey - 1], [24, ey - 1]],
        mouth: [[17, my + 1], [18, my], [19, my + 1], [20, my + 1], [21, my], [22, my + 1]],
        tongue: [],
      },
      sleep: {
        eye: [[13, ey + 1], [14, ey + 1], [15, ey + 1], [24, ey + 1], [25, ey + 1], [26, ey + 1]],
        glint: [],
        mouth: [[19, my + 1], [20, my + 1]],
        tongue: [],
      },
    };
  }
  function character(kind, face) {
    const P = CHAR[kind], maps = faceMaps(P), F = maps[face];
    const feat = SET([...F.eye, ...(F.brow || []), ...F.mouth]);
    const glint = SET(F.glint);
    const tongue = SET(F.tongue);
    return paint(40, 40, (x, y) => {
      const d = P.deco(x, y);
      if (d) return d;
      if (!P.shapes.some(e => inEll(x, y, e))) return null;
      const k = K(x, y);
      if (glint.has(k)) return '#FFFFFF';
      if (tongue.has(k)) return P.tongue;
      if (feat.has(k)) return P.eye;
      if (maps.cheeks.has(k)) return P.cheek;
      const det = P.detail(x, y);
      if (det) return det;
      const dx = (x + 0.5 - 20) / 11;
      const shadeY = 27.5 + (1 - dx * dx) * 2.5;
      return y >= shadeY ? P.shade : P.body;
    }, P.line);
  }

  /* Marian volando: lienzo 56x44 para que las orejas se abran y aleteen como alitas sin cortarse.
     Frames: 0 = arriba, 1 = abiertas/planeo, 2 = empuje abajo, 3 = recogiendo. */
  const FLY_EARS = [
    { rx1: 4.5, ry1: 2.6, x1: 18, y1: 14.5, a1: 0.52, rx2: 5.8, ry2: 3.3, x2: 11, y2: 10.2, a2: 0.38, shadeOff: 0.9 },
    { rx1: 4.8, ry1: 2.7, x1: 17.5, y1: 16.5, a1: 0.10, rx2: 6.2, ry2: 3.4, x2: 9.5, y2: 16.8, a2: -0.08, shadeOff: 1.0 },
    { rx1: 4.6, ry1: 2.7, x1: 17.5, y1: 18.5, a1: -0.52, rx2: 5.8, ry2: 3.3, x2: 11.2, y2: 24.0, a2: -0.82, shadeOff: 1.2 },
    { rx1: 4.6, ry1: 2.6, x1: 17.5, y1: 17.5, a1: -0.20, rx2: 5.8, ry2: 3.3, x2: 10.5, y2: 20.0, a2: -0.35, shadeOff: 1.0 },
  ];
  function flyMarian(face, frame) {
    const P = CHAR.marian, maps = faceMaps(P), F = maps[face];
    const feat = SET([...F.eye, ...(F.brow || []), ...F.mouth]);
    const glint = SET(F.glint);
    const tongue = SET(F.tongue);
    const W = 56, OX = 8, OY = 2;
    const ep = FLY_EARS[frame % FLY_EARS.length];
    const bodyShapes = [
      [20 + OX, 15 + OY, 9.2, 7.8], [20 + OX, 26 + OY, 10.2, 8.6],
      [12.5 + OX, 25.5 + OY, 2.8, 2.3], [27.5 + OX, 25.5 + OY, 2.8, 2.3],
      [14.5 + OX, 34.5 + OY, 3.2, 2.2], [25.5 + OX, 34.5 + OY, 3.2, 2.2],
    ];
    const inLeftEar = (x, y) => inRotEll(x, y, ep.x1, ep.y1, ep.rx1, ep.ry1, ep.a1) || inRotEll(x, y, ep.x2, ep.y2, ep.rx2, ep.ry2, ep.a2);
    const inRightEar = (x, y) => inRotEll(x, y, W - ep.x1, ep.y1, ep.rx1, ep.ry1, -ep.a1) || inRotEll(x, y, W - ep.x2, ep.y2, ep.rx2, ep.ry2, -ep.a2);
    return paint(W, 44, (x, y) => {
      const lx = x - OX, ly = y - OY;
      const bowY = frame === 0 ? y + 1 : frame === 2 ? y - 1 : y;
      const d = bow(lx, bowY - OY) || crownMarian(lx, ly);
      if (d) return d;
      const inBody = bodyShapes.some(e => inEll(x, y, e));
      const le = inLeftEar(x, y), re = inRightEar(x, y);
      if (!inBody && !le && !re) return null;
      if (inBody) {
        const k = K(lx, ly);
        if (glint.has(k)) return '#FFFFFF';
        if (tongue.has(k)) return P.tongue;
        if (feat.has(k)) return P.eye;
        if (maps.cheeks.has(k)) return P.cheek;
        if ((lx === 12 || lx === 27) && ly >= 14 && ly <= 17) return '#9BBCE3';
        const dx = (lx + 0.5 - 20) / 11;
        const shadeY = 27.5 + (1 - dx * dx) * 2.5;
        return ly >= shadeY ? P.shade : P.body;
      }
      /* Sombreado suave debajo de cada oreja al batir el aire. */
      const cx = x + 0.5, cy = y + 0.5;
      const t = le ? (cx - ep.x2) / Math.max(1, ep.x1 - ep.x2) : (W - cx - ep.x2) / Math.max(1, ep.x1 - ep.x2);
      const midY = ep.y2 + (ep.y1 - ep.y2) * Math.max(0, Math.min(1, t));
      return cy >= midY + ep.shadeOff ? P.earShade : P.body;
    }, P.line);
  }

  /* ---------- comida ---------- */
  const STRAWBERRY = [
    '.......ggg......',
    '......gHLg......',
    '..gggggLLggggg..',
    '.gHHLLGLLGLLGGg.',
    '.gGpprrLGrrrrGg.',
    '.opwrrrGrrrrrdo.',
    '.opwrrrrrrsrrdo.',
    '.oprrrsrrrrrrdo.',
    '..orsrrrrrrsdo..',
    '..orrrrrsrrrdo..',
    '...orsrrrrsdo...',
    '...orrrrrdddo...',
    '....orrsdddo....',
    '.....orrddo.....',
    '......ordo......',
    '.......oo.......',
  ];
  const STRAWBERRY_PAL = {
    g: '#24522D',
    G: '#378C43',
    L: '#5BC75E',
    H: '#93EA7A',
    o: '#701629',
    r: '#EC3B54',
    d: '#C42039',
    p: '#FF8095',
    w: '#FFD4DC',
    s: '#FFE37E',
  };
  const strawberry = () => gridArt(STRAWBERRY, STRAWBERRY_PAL);
  const COOKIE = [
    '................',
    '.....oooooo.....',
    '...oobhhhhboo...',
    '..obhhbbccbbbo..',
    '.obhhbbCccbbddo.',
    '.obbccbbbbbbbdo.',
    '.obbbbbbbccbbdo.',
    '.obhbbbbccbbbdo.',
    '.obbCccbbbccddo.',
    '.obbccbbbbbcddo.',
    '.obbbbbbbbbdddo.',
    '.odbbccbbbddddo.',
    '..oddbccbbdddo..',
    '...ooddddddoo...',
    '.....oooooo.....',
    '................',
  ];
  const COOKIE_PAL = { o: '#6B3D1B', h: '#F3CB8E', b: '#DFA763', d: '#BD8141', c: '#543219', C: '#7C4F2B' };
  const cookie = () => gridArt(COOKIE, COOKIE_PAL);

  const DONUT = [
    '................',
    '.....oooooo.....',
    '...ooPPPPPPoo...',
    '..oPPWWPPPYYPo..',
    '.oPPWPPPPBBPPPo.',
    '.oPPPPppppppPPo.',
    '.oPpppoooopppPo.',
    '.oPpppo..opppbo.',
    '.oPpppo..opbbbo.',
    '.oPbppoooopbbdo.',
    '.obbbppppppdddo.',
    '.obbbppVVppdddo.',
    '..obbbpppddddo..',
    '...oobbbdddoo...',
    '.....oooooo.....',
    '................',
  ];
  const DONUT_PAL = {
    o: '#874D28', P: '#FF9EC2', p: '#EE7CA8', W: '#FFE3EE',
    b: '#EBB778', d: '#CC8E4D', Y: '#FFE278', B: '#7CD0F8', V: '#CDB8FA',
  };
  const donut = () => gridArt(DONUT, DONUT_PAL);

  const APPLE = [
    '.......tt.ggg...',
    '......tTtgHLg...',
    '..ooooogTgggoo..',
    '.opppprTTrrrrdo.',
    '.opwppprrrrrddo.',
    '.opwrrrrrrrrddo.',
    '.oprrrrrrrrrddo.',
    '.orrrrrrrrrdddo.',
    '..orrrrrrrdddo..',
    '..orrrrrrrdddo..',
    '...orrrrrdddo...',
    '...orrrrrdddo...',
    '...oorrrdddoo...',
    '....orrooddo....',
    '.....oo..oo.....',
    '................',
  ];
  const APPLE_PAL = {
    o: '#751F1D', p: '#FF7D78', w: '#FFD0CD', r: '#E7423D', d: '#BF2725',
    t: '#4A311A', T: '#7A522E', g: '#24522D', H: '#93EA7A', L: '#5BC75E',
  };
  const apple = () => gridArt(APPLE, APPLE_PAL);

  const BROCCOLI = [
    '.....gggggg.....',
    '...ggHHLLLLgg...',
    '..gHHLLLLLLGGg..',
    '.gHHLLGGGGLLLGg.',
    '.gHLLGHHLLGLLGg.',
    '.gLLGHLLLLGLLGg.',
    '.gGGGGLLLLGGGGg.',
    '..ggGGLLLLGGgg..',
    '...gGGSSSSGGg...',
    '....kkSSSSkk....',
    '.....kSSsdk.....',
    '.....kSSsdk.....',
    '.....kSSsdk.....',
    '......kSdk......',
    '......kkkk......',
    '................',
  ];
  const BROCCOLI_PAL = {
    g: '#24522D', G: '#3D843B', L: '#63B857', H: '#94DF7D',
    k: '#426635', S: '#A9D68E', s: '#C6E7AF', d: '#81B169',
  };
  const broccoli = () => gridArt(BROCCOLI, BROCCOLI_PAL);

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
  const STAR = [
    '.....Y.....',
    '....YHY....',
    '....YHY....',
    'YYYYHHYYYYY',
    '.YYHHHHHYY.',
    '..YYHHHYY..',
    '..YYYYDYY..',
    '.YYY...YYY.',
    '.YY.....YY.',
    'Y.........Y',
    '...........',
  ];
  const starArt = () => gridArt(STAR, { Y: '#FFD24C', H: '#FFF7C2', D: '#F2AC29' }, '#B57A18');
  function bubbleArt() {
    const RB = ['#FF9AB8', '#FFE08A', '#C5EDD1', '#8AC0E6', '#C9B6F5'];
    return paint(14, 14, (x, y) => {
      const dx = x + 0.5 - 7, dy = y + 0.5 - 7, d = Math.hypot(dx, dy);
      if (d > 6.6) return null;
      if (d >= 5.1) {
        const a = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2);
        return RB[Math.floor(a * RB.length) % RB.length];
      }
      if ((x === 3 && (y === 3 || y === 4)) || (x === 4 && y === 3)) return '#FFFFFF';
      if (x === 9 && y === 9) return 'rgba(255,255,255,0.75)';
      return 'rgba(255,255,255,0.45)';
    }, '#9E88D4');
  }
  function stormArt() {
    const S = [[16, 25, 11], [31, 18, 15], [47, 24, 12], [24, 29, 9], [40, 29, 9], [10, 29, 6], [53, 29, 6]];
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
      if (DARK.has(k)) return '#26304A';
      if (BLUSH.has(k)) return '#FF92B2';
      if (cy <= 12 && cx >= 22 && cx <= 38) return '#EDF2FA';
      return cy >= 29 ? '#9CA9C6' : '#CED8EC';
    }, '#5A6785');
  }
  const BOLT = ['....YY.', '...YWY.', '..YWW..', '.YYYYY.', '....YY.', '...YY..', '..Y....'];
  const boltArt = () => gridArt(BOLT, { Y: '#FFE054', W: '#FFF8BE' }, '#B58816');
  const HEART = ['.RR.RR.', 'RHRRRRR', 'RRRRRRR', '.RRRRD.', '..RRD..', '...D...'];
  const heartArt = () => gridArt(HEART, { R: '#F26B8D', H: '#FFC7D6', D: '#D1476B' }, '#962E4C');

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
      const wave = 22.5 + Math.sin(cx * 0.28) * 1.2;
      return cy >= wave ? pal.shade : pal.body;
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
      if (x >= 12 && x <= 13 && (y === 4 || y === 5)) return '#F7A94B';
      if (x <= 2 && y === 4) return '#DCEBFA';
      if (((cx - 6.8) / 4.6) ** 2 + ((cy - 5) / 2.6) ** 2 <= 1) {
        if (x === 9 && y === 4) return '#243F7A';
        if (x === 8 && y === 5) return '#FFA8C2';
        return cy > 5.8 ? '#DCEBFA' : '#FFFFFF';
      }
      if (f === 0 && y <= 2 && Math.abs(x - 6) <= 3 - y) return y === 2 ? '#DCEBFA' : '#FFFFFF';
      if (f === 1 && y >= 7 && Math.abs(x - 6) <= y - 6) return '#DCEBFA';
      return null;
    }, '#6D92C2');
  }
  function wheelArt(f) {
    const th = (f * Math.PI) / 8;
    return paint(16, 16, (x, y) => {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 8, r = Math.hypot(dx, dy);
      if (r > 6.9) return null;
      if (r <= 1.5) return '#FFE19C';
      if (r >= 5.7) return '#4B2F1A';
      const a = Math.atan2(dy, dx);
      const spoke = r <= 5.6 && (Math.abs(Math.sin(a - th)) * r < 0.65 || Math.abs(Math.sin(a - th - Math.PI / 2)) * r < 0.65);
      return spoke ? '#ECC98B' : '#70492A';
    }, '#2A180D');
  }
  /* Tronco: corteza texturizada, brotes y flores arriba, parte trasera redondeada como la delantera y anillos adelante. */
  function logArt(W, H) {
    const ry = H / 2 - 1.5, rx = ry * 0.78, ecx = W - rx - 1, ecxL = rx + 1, ecy = H / 2;
    const FLOW = SET([[Math.round(W * 0.25), 2], [Math.round(W * 0.52), 3], [Math.round(W * 0.78), 2]]);
    const LEAF = SET([[Math.round(W * 0.25) - 1, 2], [Math.round(W * 0.52) + 1, 3], [Math.round(W * 0.78) - 1, 2]]);
    const KNOT = SET([[Math.round(W * 0.36), Math.round(H * 0.62)], [Math.round(W * 0.64), Math.round(H * 0.72)]]);
    return paint(W, H, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      const ex = (cx - ecx) / rx, ey = (cy - ecy) / ry, d = Math.sqrt(ex * ex + ey * ey);
      if (d <= 1) return d < 0.28 ? '#B67329' : Math.floor(d * 5) % 2 ? '#F0CE96' : '#DDA964';
      const exL = (cx - ecxL) / rx, dL = Math.sqrt(exL * exL + ey * ey);
      if (cx < ecxL) {
        if (dL > 1) return null;
        if (cy < 3.5) return '#BA824B';
        if (dL > 0.72) return '#674023';
        return dL < 0.35 ? '#7A4D2A' : '#8F5D34';
      }
      if (cx > ecx || cy < 1 || cy > H - 1) return null;
      const k = K(x, y);
      if (FLOW.has(k)) return '#FF95B8';
      if (LEAF.has(k)) return '#66C761';
      if (KNOT.has(k)) return '#4A2F17';
      if (cy < 3.5) return '#BA824B';
      if (cy > H - 3.5) return '#674023';
      return (x + (y % 2) * 4) % 9 === 0 ? '#5C381E' : '#8F5D34';
    }, '#3A2415');
  }
  /* Tocón para saltar: tapa con anillos, raíces abajo y brote verde al costado. */
  function stumpArt() {
    return paint(28, 20, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if ((x === 3 || x === 4) && y === 12) return '#5BC75E';
      if (x === 3 && y === 11) return '#93EA7A';
      const te = ((cx - 14) / 12.5) ** 2 + ((cy - 6) / 4.5) ** 2;
      if (te <= 1) return te < 0.09 ? '#B67329' : Math.floor(Math.sqrt(te) * 4) % 2 ? '#F0CE96' : '#DDA964';
      const flare = y >= 15 ? (y - 15) * 0.55 : 0;
      if (cx < 2.5 - flare || cx > 25.5 + flare || cy < 6 || cy > 19.5) return null;
      return cy > 16 ? '#674023' : (x + (y % 2) * 2) % 7 === 3 ? '#5C381E' : '#8F5D34';
    }, '#3A2415');
  }
  function logIcon() {
    return paint(16, 16, (x, y) => {
      const cx = x + 0.5, cy = y + 0.5;
      if (x === 4 && y === 3) return '#FF95B8';
      if ((x === 5 && y === 3) || (x === 5 && y === 4)) return '#5BC75E';
      const ex = (cx - 11.5) / 3.4, ey = (cy - 8.5) / 4.6, d = Math.sqrt(ex * ex + ey * ey);
      if (d <= 1) return d < 0.32 ? '#B67329' : Math.floor(d * 4) % 2 ? '#F0CE96' : '#DDA964';
      if (cx > 11.5 || cy < 4.5 || cy > 12.5) return null;
      if (cy < 6.2) return '#BA824B';
      if (cy > 10.8) return '#674023';
      return (x + y) % 5 === 1 ? '#5C381E' : '#8F5D34';
    }, '#3A2415');
  }
  const VUELO_ICON = [
    '................',
    '.....oooooo.....',
    '....oYYPPYYo....',
    '...ooDDDDDDoo...',
    '..oWWWWWWWWbBo..',
    '.oSWWWWWWWbKBbo.',
    'oSSWWEWWWWEWbBbo',
    'oSSWWEWWWWEWWSSo',
    'oSSWPWWMMWWPWSSo',
    'oSSWWWWWWWWWWSSo',
    '.ooWWWWWWWWWWoo.',
    '..oWWWWWWWWWWo..',
    '..oWWSSSSSSWWo..',
    '...oooooooooo...',
    '................',
    '................',
  ];
  const VUELO_PAL = {
    o: '#5E88BD', W: '#FFFFFF', S: '#D2E6FC', E: '#243656',
    P: '#FF9AB8', M: '#D97296', Y: '#FFE06B', D: '#E5A932',
    b: '#FF7EB0', B: '#FFA8CB', K: '#D9427B',
  };
  const vueloIcon = () => gridArt(VUELO_ICON, VUELO_PAL);

  const ICONS = {
    comida: () => strawberry(),
    carrito: () => logIcon(),
    vuelo: () => vueloIcon(),
  };

  NV.Art = {
    char: (kind, face) => memo('c' + kind + face, () => character(kind, face)),
    flyChar: (face, frame) => memo('fm' + face + (frame % 4), () => flyMarian(face, frame % 4)),
    /* Dibuja un personaje con los pies en feetY y centrado en cx. k escala el personaje. */
    drawChar(ctx, kind, face, cx, feetY, k = 1) {
      const S = 40 * PX * k;
      ctx.drawImage(NV.Art.char(kind, face), cx - S / 2, feetY - 37.5 * PX * k, S, S);
    },
    drawFlyChar(ctx, face, frame, cx, feetY) {
      ctx.drawImage(NV.Art.flyChar(face, frame), cx - 28 * PX, feetY - 39.5 * PX, 56 * PX, 44 * PX);
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
