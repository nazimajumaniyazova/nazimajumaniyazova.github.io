// Follower ring that reacts to what is under the pointer:
//   [data-magnetic]       the element leans towards the pointer and the ring wraps it
//   [data-cursor="Text"]  the ring grows and shows the text
//   a, button             the ring shrinks
(() => {
  const cursor = document.querySelector('.cursor');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!cursor || !finePointer || reducedMotion) return;

  const label = cursor.querySelector('.cursor__label');
  const FOLLOW = 0.2; // share of the remaining distance covered per frame
  const MAGNET_PULL = 0.3; // how far a magnetic element moves towards the pointer
  const STUCK_PADDING = 10; // px between a magnetic element and the ring

  const pointer = { x: 0, y: 0 };
  const ring = { x: 0, y: 0 };
  let stuckTo = null;
  let frame = 0;

  const render = () => {
    let targetX = pointer.x;
    let targetY = pointer.y;

    if (stuckTo) {
      const rect = stuckTo.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    ring.x += (targetX - ring.x) * FOLLOW;
    ring.y += (targetY - ring.y) * FOLLOW;
    cursor.style.setProperty('--x', `${ring.x.toFixed(1)}px`);
    cursor.style.setProperty('--y', `${ring.y.toFixed(1)}px`);

    const settled = Math.abs(targetX - ring.x) < 0.1 && Math.abs(targetY - ring.y) < 0.1;
    frame = settled && !stuckTo ? 0 : requestAnimationFrame(render);
  };

  const requestRender = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };

  const release = () => {
    if (!stuckTo) return;
    stuckTo.style.removeProperty('--tx');
    stuckTo.style.removeProperty('--ty');
    stuckTo = null;
    cursor.classList.remove('is-stuck');
    cursor.style.removeProperty('width');
    cursor.style.removeProperty('height');
    cursor.style.removeProperty('border-radius');
  };

  const stick = (element) => {
    if (stuckTo === element) return;
    release();
    stuckTo = element;
    const rect = element.getBoundingClientRect();
    cursor.classList.add('is-stuck');
    cursor.style.width = `${rect.width + STUCK_PADDING * 2}px`;
    cursor.style.height = `${rect.height + STUCK_PADDING * 2}px`;
    // Pills stay pills, round buttons stay round.
    cursor.style.borderRadius = `${Math.min(rect.width, rect.height) / 2 + STUCK_PADDING}px`;
  };

  const update = (target) => {
    const element = target instanceof Element ? target : null;
    const magnetic = element && element.closest('[data-magnetic]');
    const labelled = element && element.closest('[data-cursor]');
    const link = element && element.closest('a, button');

    if (magnetic) stick(magnetic);
    else release();

    cursor.classList.toggle('is-label', !magnetic && Boolean(labelled));
    cursor.classList.toggle('is-link', !magnetic && !labelled && Boolean(link));
    if (labelled) label.textContent = labelled.dataset.cursor;
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!cursor.classList.contains('is-active')) {
        // First move: start at the pointer instead of flying in from the corner.
        ring.x = pointer.x;
        ring.y = pointer.y;
        cursor.classList.add('is-active');
      }

      update(event.target);

      if (stuckTo) {
        const rect = stuckTo.getBoundingClientRect();
        // The rect already includes the current shift, so take it out first.
        const shiftX = parseFloat(stuckTo.style.getPropertyValue('--tx')) || 0;
        const shiftY = parseFloat(stuckTo.style.getPropertyValue('--ty')) || 0;
        const centerX = rect.left + rect.width / 2 - shiftX;
        const centerY = rect.top + rect.height / 2 - shiftY;
        stuckTo.style.setProperty('--tx', `${((pointer.x - centerX) * MAGNET_PULL).toFixed(1)}px`);
        stuckTo.style.setProperty('--ty', `${((pointer.y - centerY) * MAGNET_PULL).toFixed(1)}px`);
      }

      requestRender();
    },
    { passive: true },
  );

  // Hide the ring when the pointer leaves the window.
  document.documentElement.addEventListener('pointerleave', () => {
    cursor.classList.remove('is-active');
    release();
  });

  // Small press feedback.
  window.addEventListener('pointerdown', () => {
    cursor.animate([{ scale: 1 }, { scale: 0.8 }, { scale: 1 }], {
      duration: 300,
      easing: 'ease-out',
    });
  });
})();
