// Editor shell: files and tabs, explorer, themes, status bar.
// Other scripts talk to it through window.Portfolio.
(function () {
  'use strict';

  const root = document.documentElement;
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));

  // To add a theme: add a [data-theme] block in _tokens.scss and a line here.
  const THEMES = [
    { id: 'midnight', label: 'Midnight', chrome: '#090c14' },
    { id: 'paper', label: 'Paper', chrome: '#e9e5dc' },
    { id: 'sunset', label: 'Sunset', chrome: '#120c17' },
  ];

  // Old section links and friendly names that should still open a file.
  const ALIASES = {
    home: 'readme',
    portfolio: 'dachatop',
    projects: 'dachatop',
    joytop: 'dachatop',
    work: 'dachatop',
    contacts: 'contact',
  };

  const desktop = window.matchMedia('(min-width: 48em)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tabs = $('#tabs');
  const panes = $('#panes');
  const empty = $('#empty');
  const breadcrumbs = $('#breadcrumbs');
  const statusLine = $('#status-line');
  const statusLang = $('#status-lang');
  const statusMsg = $('#status-msg');
  const statusTheme = $('#status-theme');
  const statusClock = $('#status-clock');

  const files = $$('.file').map((el) => ({
    id: el.id,
    el,
    name: el.dataset.name,
    path: el.dataset.path,
    ext: el.dataset.ext,
    lang: el.dataset.lang,
  }));

  files.forEach((file) => {
    file.el.setAttribute('role', 'tabpanel');
    file.el.setAttribute('aria-label', file.name);
    $$('.l', file.el).forEach((line, index) => {
      line.style.setProperty('--n', index);
      line.dataset.n = index + 1;
    });
  });

  let openIds = [];
  let activeId = null;

  const getFile = (id) => files.find((file) => file.id === id) || null;

  function resolve(hash) {
    const id = String(hash || '')
      .replace(/^#/, '')
      .toLowerCase();
    return getFile(ALIASES[id] || id);
  }

  // ---------- Tabs and files ----------

  function render(newId) {
    tabs.textContent = '';
    openIds.forEach((id) => {
      const file = getFile(id);
      const tab = document.createElement('div');
      tab.className =
        'tab' + (id === activeId ? ' is-active' : '') + (id === newId ? ' is-new' : '');
      tab.setAttribute('role', 'presentation');

      const open = document.createElement('button');
      open.className = 'tab__open';
      open.type = 'button';
      open.dataset.open = id;
      open.dataset.ext = file.ext;
      open.setAttribute('role', 'tab');
      open.setAttribute('aria-selected', String(id === activeId));
      open.setAttribute('aria-controls', id);
      open.textContent = file.name;

      const close = document.createElement('button');
      close.className = 'tab__close';
      close.type = 'button';
      close.dataset.close = id;
      close.setAttribute('aria-label', 'Close ' + file.name);
      close.textContent = '×';

      tab.append(open, close);
      tabs.append(tab);
      if (id === activeId) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });

    files.forEach((file) => file.el.classList.toggle('is-active', file.id === activeId));
    empty.hidden = Boolean(activeId);

    $$('.tree__file').forEach((link) => {
      if (link.getAttribute('href') === '#' + activeId) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    const active = getFile(activeId);
    breadcrumbs.textContent = active
      ? 'nazima-portfolio › ' + active.path.split('/').join(' › ')
      : 'nazima-portfolio';
    statusLang.textContent = active ? active.lang : 'Plain Text';
    statusLine.textContent = 'Ln 1';
    // The minimap and the source control view follow the active file.
    document.dispatchEvent(new CustomEvent('portfolio:open', { detail: activeId }));
  }

  function openFile(id, options) {
    const file = getFile(id);
    if (!file) return false;
    const isNew = !openIds.includes(id);
    if (isNew) openIds.push(id);
    activeId = id;
    render(isNew ? id : null);
    panes.scrollTop = 0;
    root.classList.remove('explorer-open');
    if (!options || options.updateHash !== false) {
      try {
        history.replaceState(null, '', '#' + id);
      } catch (e) {
        // file:// pages may refuse history changes; navigation still works.
      }
    }
    return true;
  }

  function closeFile(id) {
    const index = openIds.indexOf(id);
    if (index === -1) return;
    openIds.splice(index, 1);
    if (activeId === id) activeId = openIds[Math.min(index, openIds.length - 1)] || null;
    render();
    try {
      history.replaceState(null, '', activeId ? '#' + activeId : location.pathname);
    } catch (e) {
      // see openFile
    }
  }

  // ---------- Layout toggles ----------

  function toggleExplorer() {
    root.classList.toggle(desktop.matches ? 'explorer-collapsed' : 'explorer-open');
  }

  // The side bar has two views, Explorer and Search, as in VS Code.
  let view = 'explorer';

  const sidebarVisible = () =>
    desktop.matches
      ? !root.classList.contains('explorer-collapsed')
      : root.classList.contains('explorer-open');

  function showView(name) {
    view = name;
    $$('[data-panel]').forEach((panel) => (panel.hidden = panel.dataset.panel !== name));
    $$('[data-view]').forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.view === name)),
    );
    root.classList.remove('explorer-collapsed');
    if (!desktop.matches) root.classList.add('explorer-open');
    if (name === 'search') {
      const input = $('#search-input');
      input.focus();
      input.select();
    }
  }

  // Clicking the icon of the view that is already open hides the side bar.
  function toggleView(name) {
    if (sidebarVisible() && view === name) toggleExplorer();
    else showView(name);
  }

  function toggleTerminal(show) {
    const collapsed =
      typeof show === 'boolean' ? !show : !root.classList.contains('terminal-collapsed');
    root.classList.toggle('terminal-collapsed', collapsed);
    $('.terminal__tab').setAttribute('aria-expanded', String(!collapsed));
    if (!collapsed && desktop.matches) $('#terminal-input').focus();
  }

  // ---------- Status bar ----------

  let flashTimer;
  function flash(message) {
    statusMsg.textContent = message;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (statusMsg.textContent = ''), 2500);
  }

  function setTheme(id) {
    const theme = THEMES.find((item) => item.id === id);
    if (!theme) return false;
    root.setAttribute('data-theme', theme.id);
    statusTheme.textContent = theme.label;
    $('meta[name="theme-color"]').setAttribute('content', theme.chrome);
    try {
      localStorage.setItem('theme', theme.id);
    } catch (e) {
      // Private mode: the theme simply resets on the next visit.
    }
    document.dispatchEvent(new CustomEvent('portfolio:theme', { detail: theme }));
    return true;
  }

  function cycleTheme() {
    const current = THEMES.findIndex((item) => item.id === root.getAttribute('data-theme'));
    const next = THEMES[(current + 1) % THEMES.length];
    setTheme(next.id);
    flash('Theme: ' + next.label);
  }

  function tickClock() {
    try {
      const time = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tashkent',
      }).format(new Date());
      statusClock.textContent = 'Tashkent ' + time;
    } catch (e) {
      statusClock.hidden = true;
    }
  }

  function copyText(text) {
    if (!navigator.clipboard) return flash('Copy is not available here');
    navigator.clipboard.writeText(text).then(
      () => flash('Copied: ' + text),
      () => flash('Could not copy'),
    );
  }

  // Lights the skills up one by one. Used by the "skills" terminal command.
  function lightSkills() {
    $$('#skills .skill').forEach((skill, index) => {
      setTimeout(() => skill.classList.add('is-lit'), 300 + index * 90);
      setTimeout(() => skill.classList.remove('is-lit'), 1100 + index * 90);
    });
  }

  // ---------- Typed words in the README preview ----------

  function startTyping(el) {
    const words = el.dataset.words.split('|');
    if (reducedMotion || words.length < 2) return;
    let word = 0;
    let length = words[0].length;
    let deleting = true;

    (function step() {
      const text = words[word];
      length += deleting ? -1 : 1;
      el.textContent = text.slice(0, length);
      let delay = deleting ? 45 : 95;
      if (!deleting && length === text.length) {
        deleting = true;
        delay = 1700;
      } else if (deleting && length === 0) {
        deleting = false;
        word = (word + 1) % words.length;
        delay = 300;
      }
      setTimeout(step, delay);
    })();
  }

  // ---------- Events ----------

  const actions = {
    explorer: toggleExplorer,
    'view-explorer': () => toggleView('explorer'),
    'view-search': () => toggleView('search'),
    'view-scm': () => toggleView('scm'),
    terminal: () => toggleTerminal(),
    theme: cycleTheme,
    palette: () => api.openPalette && api.openPalette(),
  };

  document.addEventListener('click', (event) => {
    const target = event.target;

    const action = target.closest('[data-action]');
    if (action) {
      actions[action.dataset.action]();
      return;
    }

    const viewButton = target.closest('[data-view]');
    if (viewButton) {
      showView(viewButton.dataset.view);
      return;
    }

    const close = target.closest('[data-close]');
    if (close) {
      closeFile(close.dataset.close);
      return;
    }

    const open = target.closest('[data-open]');
    if (open) {
      openFile(open.dataset.open);
      return;
    }

    const copy = target.closest('[data-copy]');
    if (copy) {
      copyText(copy.dataset.copy);
      return;
    }

    // In-page links open files instead of scrolling.
    const link = target.closest('a[href^="#"]');
    if (link) {
      const file = resolve(link.getAttribute('href'));
      if (file) {
        event.preventDefault();
        openFile(file.id);
      }
    }
  });

  // Middle click closes a tab, as in editors and browsers.
  tabs.addEventListener('auxclick', (event) => {
    const tab = event.target.closest('.tab');
    if (event.button === 1 && tab) closeFile($('[data-close]', tab).dataset.close);
  });

  panes.addEventListener('mouseover', (event) => {
    const line = event.target.closest('.l');
    if (line) statusLine.textContent = 'Ln ' + line.dataset.n;
  });

  panes.addEventListener('click', (event) => {
    const line = event.target.closest('.l');
    if (!line) return;
    $$('.l.is-current', panes).forEach((item) => item.classList.remove('is-current'));
    line.classList.add('is-current');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') root.classList.remove('explorer-open');
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'f' && event.shiftKey) {
      event.preventDefault();
      showView('search');
    } else if (key === 'g' && event.shiftKey) {
      event.preventDefault();
      showView('scm');
    } else if (key === 'k' || key === 'p') {
      event.preventDefault();
      actions.palette();
    } else if (key === 'b') {
      event.preventDefault();
      toggleExplorer();
    } else if (key === 'j' || key === '`') {
      event.preventDefault();
      toggleTerminal();
    }
  });

  window.addEventListener('hashchange', () => {
    const file = resolve(location.hash);
    if (file && file.id !== activeId) openFile(file.id, { updateHash: false });
  });

  // ---------- Start ----------

  const api = {
    files,
    themes: THEMES,
    resolve,
    openFile,
    closeFile,
    getActive: () => getFile(activeId),
    setTheme,
    cycleTheme,
    toggleExplorer,
    showView,
    toggleTerminal,
    flash,
    copyText,
    lightSkills,
    reducedMotion,
  };
  window.Portfolio = api;

  const savedTheme = THEMES.find((item) => item.id === root.getAttribute('data-theme'));
  setTheme(savedTheme ? savedTheme.id : THEMES[0].id);

  if (!desktop.matches) toggleTerminal(false);

  const first = resolve(location.hash);
  openFile('readme', { updateHash: false });
  if (first && first.id !== 'readme') openFile(first.id, { updateHash: false });

  tickClock();
  setInterval(tickClock, 30000);
  $$('.typed').forEach(startTyping);
})();
