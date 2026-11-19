// Navigation panel, section reveal and the "scroll" hint.
(() => {
  const root = document.documentElement;
  const burger = document.querySelector('.burger');
  const header = document.querySelector('.header');
  const page = document.querySelector('.page');

  // --- Menu -----------------------------------------------------------------
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  const isMenuOpen = () => root.classList.contains('menu-open');

  burger.addEventListener('click', () => setMenu(!isMenuOpen()));

  // Any link in the panel closes it, so does a click on the page behind it.
  header.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  page.addEventListener('click', () => {
    if (isMenuOpen()) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
      setMenu(false);
      burger.focus();
    }
  });

  // --- Reveal sections once -------------------------------------------------
  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // --- Highlight the current section in the menu ----------------------------
  const links = new Map();
  document.querySelectorAll('.menu__link[href^="#"]').forEach((link) => {
    links.set(link.getAttribute('href').slice(1), link);
  });
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link, id) => {
            if (id === entry.target.id) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
          });
        });
      },
      // A section counts as current while it crosses the middle of the screen.
      { rootMargin: '-50% 0px -50% 0px' },
    );
    links.forEach((link, id) => {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  // --- Scroll hint ------------------------------------------------------------
  const onScroll = () => root.classList.toggle('is-scrolled', window.scrollY > 200);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
