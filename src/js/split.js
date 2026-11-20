// Second editor group. Drag a tab (or a file from the explorer) to the right
// half of the editor, or press the split button, to see two files side by
// side. The second group shows a copy of the file's code; every control in
// the files uses delegated events, so the copy works like the original.
(function () {
  'use strict';

  const P = window.Portfolio;
  const root = document.documentElement;
  const body = document.getElementById('editor-body');
  const scroll = document.getElementById('side-scroll');
  const title = document.getElementById('side-name');
  const dropzone = document.getElementById('dropzone');
  if (!P || !body || !scroll) return;

  // Two groups only fit from the xl breakpoint (80em).
  const wide = window.matchMedia('(min-width: 80em)');
  const FILE_TYPE = 'text/x-portfolio-file';
  let sideId = null;
  let dragging = null;

  function openSide(id) {
    const file = P.resolve(id);
    if (!file) return false;
    if (!wide.matches) {
      P.flash('Split view needs a wider screen');
      return false;
    }

    const copy = file.el.querySelector('.file__source').cloneNode(true);
    copy.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    copy.querySelectorAll('label[for]').forEach((el) => el.removeAttribute('for'));
    copy
      .querySelectorAll('textarea')
      .forEach((el) => el.setAttribute('aria-label', 'Your message'));
    copy
      .querySelectorAll('.is-current, .is-found, .is-added')
      .forEach((el) => el.classList.remove('is-current', 'is-found', 'is-added'));

    scroll.textContent = '';
    scroll.append(copy);
    scroll.scrollTop = 0;
    title.textContent = file.name;
    title.dataset.ext = file.ext;
    sideId = file.id;
    root.classList.add('is-split');
    if (P.syncSettings) P.syncSettings();
    document.dispatchEvent(new CustomEvent('portfolio:split', { detail: sideId }));
    P.flash(file.name + ' opened to the side');
    return true;
  }

  function closeSide() {
    if (!sideId) return;
    sideId = null;
    root.classList.remove('is-split');
    scroll.textContent = '';
    document.dispatchEvent(new CustomEvent('portfolio:split', { detail: null }));
  }

  // The split button puts the active file on the right, as VS Code does.
  function splitRight() {
    const active = P.getActive();
    if (active) openSide(active.id);
  }

  // ---------- Drag and drop ----------

  const hideZone = () => dropzone.classList.remove('is-visible', 'is-active');

  document.addEventListener('dragstart', (event) => {
    const target = event.target.closest ? event.target : event.target.parentElement;
    const tab = target.closest('.tab[data-file]');
    const link = target.closest('.tree__file[href^="#"]');
    const id = tab ? tab.dataset.file : link ? link.getAttribute('href').slice(1) : null;
    if (!id || !P.resolve(id)) return;
    dragging = P.resolve(id).id;
    event.dataTransfer.setData(FILE_TYPE, dragging);
    event.dataTransfer.setData('text/plain', dragging);
    event.dataTransfer.effectAllowed = 'copyMove';
  });

  const onRight = (event) => {
    const rect = body.getBoundingClientRect();
    return event.clientX > rect.left + rect.width / 2;
  };

  body.addEventListener('dragover', (event) => {
    if (!dragging || !wide.matches) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    dropzone.classList.add('is-visible');
    dropzone.classList.toggle('is-active', onRight(event));
  });

  body.addEventListener('dragleave', (event) => {
    if (!body.contains(event.relatedTarget)) hideZone();
  });

  body.addEventListener('drop', (event) => {
    if (!dragging) return;
    event.preventDefault();
    if (onRight(event)) openSide(dragging);
    else P.openFile(dragging);
    hideZone();
    dragging = null;
  });

  document.addEventListener('dragend', () => {
    hideZone();
    dragging = null;
  });

  P.openSide = openSide;
  P.closeSide = closeSide;
  P.splitRight = splitRight;
  P.getSide = () => sideId;
})();
