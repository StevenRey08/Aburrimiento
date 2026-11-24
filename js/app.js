/* Arranque: navegación entre pantallas, iconos y bucle principal. */
(() => {
  'use strict';
  const NV = window.NV, $ = NV.$;
  const mods = { home: NV.Home, feed: NV.Feed, cart: NV.Cart, fly: NV.Fly };
  const screens = { home: $('home'), feed: $('feed'), cart: $('cart'), fly: $('fly') };
  let current = 'home';

  function go(name) {
    if (name === current) return;
    NV.Sound.ensure();
    if (mods[current].close) mods[current].close();
    current = name;
    for (const k in screens) screens[k].hidden = k !== name;
    mods[name].open();
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-home]')) { go('home'); return; }
    const b = e.target.closest('[data-go]');
    if (b) go(b.dataset.go);
  });
  window.addEventListener('keydown', e => {
    if (mods[current].key) mods[current].key(e.code, true, e);
  });
  window.addEventListener('keyup', e => {
    if (mods[current].key) mods[current].key(e.code, false, e);
  });
  window.addEventListener('resize', () => {
    if (mods[current].resize) mods[current].resize();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mods[current].pauseIfPlaying) mods[current].pauseIfPlaying();
    if (!document.hidden && mods.feed.resumeIfPaused && current === 'feed') mods.feed.resumeIfPaused();
  });

  document.querySelectorAll('[data-icon]').forEach(im => {
    im.src = NV.Art.dataURL(NV.Art.icon(im.dataset.icon));
  });

  let last = performance.now();
  function frame(t) {
    const dt = Math.min(0.033, Math.max(0.001, (t - last) / 1000));
    last = t;
    if (!document.hidden && mods[current].tick) mods[current].tick(dt);
    requestAnimationFrame(frame);
  }
  NV.Home.open();
  requestAnimationFrame(frame);
})();
