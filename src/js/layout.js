// Resizable side bar and terminal. Drag a sash (the thin edge between two
// parts), use the arrow keys on it, or double-click it to reset. Sizes go to
// CSS variables and localStorage; the inline script in <head> restores them.
(function () {
  'use strict';

  const P = window.Portfolio;
  const root = document.documentElement;
  const sidebar = document.getElementById('explorer');
  const terminal = document.getElementById('terminal');
  const termBody = document.getElementById('terminal-body');
  if (!P || !sidebar || !terminal) return;

  const KEY = 'layout';
  const desktop = window.matchMedia('(min-width: 48em)');
  const rem = () => parseFloat(getComputedStyle(root).fontSize) || 16;

  // Dragging past these sizes hides the part, as in VS Code.
  const SIDEBAR = { min: 160, close: 110, max: () => Math.min(window.innerWidth * 0.45, 640) };
  const TERMINAL = {
    min: 64,
    close: 36,
    // Leave room for the title bar, tabs, a few lines of code and the status bar.
    max: () => window.innerHeight - 12 * rem(),
  };

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    saved = {};
  }

  function save() {
    try {
      if (Object.keys(saved).length) localStorage.setItem(KEY, JSON.stringify(saved));
      else localStorage.removeItem(KEY);
    } catch (e) {
      // Private mode: the sizes last until the page is closed.
    }
  }

  const clamp = (value, min, max) => Math.round(Math.min(max, Math.max(min, value)));

  function setSize(name, px) {
    const prop = name === 'sidebar' ? '--sidebar-w' : '--terminal-h';
    if (px) {
      root.style.setProperty(prop, px + 'px');
      saved[name] = px;
    } else {
      root.style.removeProperty(prop);
      delete saved[name];
    }
    updateAria();
  }

  function updateAria() {
    document.querySelectorAll('[data-sash]').forEach((sash) => {
      const isSidebar = sash.dataset.sash === 'sidebar';
      const limits = isSidebar ? SIDEBAR : TERMINAL;
      sash.setAttribute('aria-valuemin', String(limits.min));
      sash.setAttribute('aria-valuemax', String(Math.round(limits.max())));
      sash.setAttribute(
        'aria-valuenow',
        String(isSidebar ? sidebar.offsetWidth : termBody.offsetHeight),
      );
    });
  }

  // ---------- Showing and hiding the parts ----------

  const sidebarOpen = () => !root.classList.contains('explorer-collapsed');
  const terminalOpen = () => !root.classList.contains('terminal-collapsed');

  function showSidebar(show) {
    root.classList.toggle('explorer-collapsed', !show);
  }

  // ---------- Dragging ----------

  let drag = null;

  function sizeFrom(event) {
    if (drag.name === 'sidebar') return event.clientX - sidebar.getBoundingClientRect().left;
    // The terminal grows upwards: its body ends where the status bar starts.
    return terminal.getBoundingClientRect().bottom - event.clientY - drag.barHeight;
  }

  function onMove(event) {
    if (!drag) return;
    const limits = drag.name === 'sidebar' ? SIDEBAR : TERMINAL;
    const size = sizeFrom(event);
    const open = drag.name === 'sidebar' ? sidebarOpen() : terminalOpen();

    if (size < limits.close) {
      if (open) {
        if (drag.name === 'sidebar') showSidebar(false);
        else P.toggleTerminal(false);
        // Reopening later brings back the size from before this drag.
        setSize(drag.name, drag.start);
      }
      return;
    }
    if (!open) {
      if (drag.name === 'sidebar') showSidebar(true);
      else P.toggleTerminal(true);
    }
    setSize(drag.name, clamp(size, limits.min, limits.max()));
  }

  function onUp() {
    if (!drag) return;
    drag.sash.classList.remove('is-dragging');
    root.classList.remove('is-resizing', 'is-resizing--row');
    drag = null;
    save();
  }

  document.addEventListener('pointerdown', (event) => {
    const sash = event.target.closest('[data-sash]');
    if (!sash || event.button !== 0) return;
    event.preventDefault();
    sash.setPointerCapture(event.pointerId);
    drag = {
      name: sash.dataset.sash,
      sash,
      start: saved[sash.dataset.sash] || null,
      barHeight: terminal.querySelector('.terminal__bar').offsetHeight,
    };
    sash.classList.add('is-dragging');
    root.classList.add('is-resizing');
    if (drag.name === 'terminal') root.classList.add('is-resizing--row');
  });

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onUp);

  // Double-click puts the default size back.
  document.addEventListener('dblclick', (event) => {
    const sash = event.target.closest('[data-sash]');
    if (!sash) return;
    setSize(sash.dataset.sash, null);
    if (sash.dataset.sash === 'sidebar') showSidebar(true);
    else P.toggleTerminal(true);
    save();
    P.flash((sash.dataset.sash === 'sidebar' ? 'Side bar' : 'Terminal') + ' size reset');
  });

  // Arrow keys on a focused sash, 16px per press (64px with Shift).
  document.addEventListener('keydown', (event) => {
    const sash = event.target.closest && event.target.closest('[data-sash]');
    if (!sash) return;
    const name = sash.dataset.sash;
    const grow = name === 'sidebar' ? 'ArrowRight' : 'ArrowUp';
    const shrink = name === 'sidebar' ? 'ArrowLeft' : 'ArrowDown';
    if (event.key === 'Enter') {
      setSize(name, null);
      save();
      event.preventDefault();
      return;
    }
    if (event.key !== grow && event.key !== shrink) return;
    event.preventDefault();
    const limits = name === 'sidebar' ? SIDEBAR : TERMINAL;
    const current = name === 'sidebar' ? sidebar.offsetWidth : termBody.offsetHeight;
    const step = (event.shiftKey ? 64 : 16) * (event.key === grow ? 1 : -1);
    if (name === 'terminal' && !terminalOpen()) P.toggleTerminal(true);
    setSize(name, clamp(current + step, limits.min, limits.max()));
    save();
  });

  // A size saved on a big screen may not fit a smaller window.
  window.addEventListener('resize', () => {
    if (saved.sidebar > SIDEBAR.max()) setSize('sidebar', clamp(SIDEBAR.max(), SIDEBAR.min, 9999));
    if (saved.terminal > TERMINAL.max()) {
      setSize('terminal', clamp(TERMINAL.max(), TERMINAL.min, 9999));
    }
  });

  desktop.addEventListener('change', updateAria);
  updateAria();

  P.resetLayout = () => {
    setSize('sidebar', null);
    setSize('terminal', null);
    save();
  };
})();
