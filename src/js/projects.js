// Project cards: tilt towards the pointer, optional video preview on hover,
// and a detail view that grows out of the card screenshot.
(() => {
  const cards = document.querySelectorAll('.project');
  const modal = document.getElementById('project-modal');
  if (!cards.length || !modal) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MAX_TILT = 7; // degrees
  const TRANSITION_NAME = 'project-shot';

  // --- Tilt and glare ---------------------------------------------------------
  if (finePointer && !reducedMotion) {
    cards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width; // 0..1
        const y = (event.clientY - rect.top) / rect.height;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', `${((x - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${((0.5 - y) * 2 * MAX_TILT).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      });
    });
  }

  // --- Video preview (cards with data-video) ----------------------------------
  if (finePointer && !reducedMotion) {
    cards.forEach((card) => {
      if (!card.dataset.video) return;
      let video = null;

      card.addEventListener('pointerenter', () => {
        if (!video) {
          video = document.createElement('video');
          video.className = 'project__video';
          video.src = card.dataset.video;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.setAttribute('aria-hidden', 'true');
          card.querySelector('.project__media').append(video);
        }
        video
          .play()
          .then(() => video.classList.add('is-playing'))
          .catch(() => {}); // the screenshot stays if the video cannot play
      });
      card.addEventListener('pointerleave', () => {
        if (!video) return;
        video.classList.remove('is-playing');
        video.pause();
      });
    });
  }

  // --- Detail view --------------------------------------------------------------
  const modalImage = modal.querySelector('.modal__image');
  const modalTitle = modal.querySelector('.modal__title');
  const modalText = modal.querySelector('.modal__text');
  const modalTags = modal.querySelector('.modal__tags');
  const modalLive = modal.querySelector('.modal__live');
  const modalCode = modal.querySelector('.modal__code');
  const modalClose = modal.querySelector('.modal__close');
  // Everything behind the detail view is made inert while it is open.
  const background = [...document.body.children].filter(
    (element) => element !== modal && !element.classList.contains('cursor'),
  );

  let activeCard = null;

  // Runs the DOM change inside a view transition where the browser supports it.
  const transition = (change) => {
    if (!document.startViewTransition || reducedMotion) {
      change();
      return Promise.resolve();
    }
    return document.startViewTransition(change).finished;
  };

  const fill = (card) => {
    const image = card.querySelector('.project__image');
    const description = card.querySelector('.project__desc');
    modalImage.src = image.currentSrc || image.src;
    modalImage.alt = image.alt;
    modalTitle.textContent = card.querySelector('.project__name').textContent;
    modalText.textContent = description ? description.textContent : '';
    modalText.hidden = !description;
    modalTags.replaceChildren(
      ...[...card.querySelectorAll('.tag')].map((tag) => tag.cloneNode(true)),
    );
    modalLive.href = card.href;
    modalCode.hidden = !card.dataset.code;
    if (card.dataset.code) modalCode.href = card.dataset.code;
  };

  const open = (card) => {
    activeCard = card;
    fill(card);
    const cardImage = card.querySelector('.project__image');

    // The same transition name moves from the card screenshot to the large one,
    // which makes the browser animate one into the other.
    cardImage.style.viewTransitionName = TRANSITION_NAME;
    transition(() => {
      cardImage.style.viewTransitionName = '';
      modalImage.style.viewTransitionName = TRANSITION_NAME;
      modal.hidden = false;
      document.documentElement.classList.add('modal-open');
      background.forEach((element) => {
        element.inert = true;
      });
      modalClose.focus();
    }).then(() => {
      modalImage.style.viewTransitionName = '';
    });
  };

  const close = () => {
    if (!activeCard) return;
    const card = activeCard;
    const cardImage = card.querySelector('.project__image');
    activeCard = null;

    modalImage.style.viewTransitionName = TRANSITION_NAME;
    transition(() => {
      modalImage.style.viewTransitionName = '';
      cardImage.style.viewTransitionName = TRANSITION_NAME;
      modal.hidden = true;
      document.documentElement.classList.remove('modal-open');
      background.forEach((element) => {
        element.inert = false;
      });
      card.focus({ preventScroll: true });
    }).then(() => {
      cardImage.style.viewTransitionName = '';
    });
  };

  cards.forEach((card) => {
    card.addEventListener('click', (event) => {
      // Ctrl/Cmd/Shift/middle click keeps the normal "open in a new tab".
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      open(card);
    });
  });

  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-modal-close]')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (modal.hidden) return;
    if (event.key === 'Escape') {
      close();
      return;
    }
    // Keep Tab inside the detail view.
    if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('a[href], button')].filter(
        (element) => !element.hidden,
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();
