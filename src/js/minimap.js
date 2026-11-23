// Minimap: a tiny picture of the open file on the right edge of the editor,
// drawn from the real text positions and colors. Click or drag it to scroll.
(function () {
  'use strict';

  const P = window.Portfolio;
  const map = document.getElementById('minimap');
  const panes = document.getElementById('panes');
  if (!P || !map || !panes) return;

  const canvas = map.querySelector('.minimap__canvas');
  const view = map.querySelector('.minimap__view');
  const ctx = canvas.getContext('2d');
  const MAX_SCALE = 0.16;
  let scale = MAX_SCALE;
  let frame = 0;

  const visible = () => map.offsetWidth > 0 && P.getActive();

  function draw() {
    frame = 0;
    if (!visible()) return;
    const source = P.getActive().el.querySelector('.file__source');
    const width = map.clientWidth;
    const height = map.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    scale = Math.min(MAX_SCALE, height / Math.max(1, panes.scrollHeight));
    const box = source.getBoundingClientRect();
    const top = panes.getBoundingClientRect().top - panes.scrollTop;
    const scaleX = Math.min(scale * 1.4, (width - 10) / Math.max(1, source.scrollWidth));
    const colors = new Map();
    const range = document.createRange();
    const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);

    let node;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue.trim()) continue;
      const parent = node.parentElement;
      if (!parent || parent.closest('.visually-hidden, textarea')) continue;
      if (!colors.has(parent)) colors.set(parent, getComputedStyle(parent).color);
      ctx.fillStyle = colors.get(parent);
      range.selectNodeContents(node);
      Array.from(range.getClientRects()).forEach((rect) => {
        const y = (rect.top - top) * scale;
        if (y > height) return;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(
          5 + (rect.left - box.left) * scaleX,
          y + rect.height * scale * 0.2,
          Math.max(1, rect.width * scaleX),
          Math.max(1, rect.height * scale * 0.6),
        );
      });
    }
    ctx.globalAlpha = 1;
    placeView();
  }

  function placeView() {
    view.style.top = panes.scrollTop * scale + 'px';
    view.style.height = Math.max(8, panes.clientHeight * scale) + 'px';
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };

  // Colors change with a short transition, so wait for it before redrawing.
  const later = () => setTimeout(schedule, 250);

  // ---------- Scrolling with the map ----------

  function scrollTo(event) {
    const y = event.clientY - map.getBoundingClientRect().top;
    panes.scrollTop = y / scale - panes.clientHeight / 2;
  }

  map.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    map.setPointerCapture(event.pointerId);
    map.classList.add('is-dragging');
    scrollTo(event);
  });

  map.addEventListener('pointermove', (event) => {
    if (map.hasPointerCapture(event.pointerId)) scrollTo(event);
  });

  map.addEventListener('pointerup', () => map.classList.remove('is-dragging'));

  panes.addEventListener('scroll', () => requestAnimationFrame(placeView), { passive: true });

  // ---------- When to redraw ----------

  document.addEventListener('portfolio:open', schedule);
  document.addEventListener('portfolio:split', schedule);
  document.addEventListener('portfolio:content', later);
  document.addEventListener('portfolio:settings', later);
  document.addEventListener('portfolio:theme', later);
  new ResizeObserver(schedule).observe(panes);
  // Lines slide in when a file opens; draw again once they have settled.
  document.addEventListener('portfolio:open', () => setTimeout(schedule, 900));
  if (document.fonts) document.fonts.ready.then(schedule);

  schedule();
})();
