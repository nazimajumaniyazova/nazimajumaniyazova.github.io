// Command palette (Ctrl K): search files and actions, run with Enter.
(function () {
  'use strict';

  const P = window.Portfolio;
  const palette = document.getElementById('palette');
  const input = document.getElementById('palette-input');
  const list = document.getElementById('palette-list');
  if (!P || !palette) return;

  const openUrl = (url) => () => window.open(url, '_blank', 'noopener');

  const items = P.files
    .map((file) => ({
      label: file.path,
      hint: 'file',
      ext: file.ext,
      run: () => P.openFile(file.id),
    }))
    .concat(
      P.themes.map((theme) => ({
        label: 'Theme: ' + theme.label,
        hint: 'color theme',
        run: () => P.setTheme(theme.id),
      })),
      P.files
        .filter((file) => file.path.startsWith('projects/'))
        .map((file) => ({
          label: 'Run ' + file.name,
          hint: 'project',
          run: () => P.runProject(file.id),
        })),
      [
        { label: 'Search in files', hint: 'Ctrl Shift F', run: () => P.showView('search') },
        { label: 'Source control: my path', hint: 'Ctrl Shift G', run: () => P.showView('scm') },
        { label: 'Settings', hint: 'Ctrl ,', run: () => P.openFile('settings') },
        { label: 'Split editor right', hint: 'wide screens', run: () => P.splitRight() },
        { label: 'Close the second editor', hint: 'split', run: () => P.closeSide() },
        { label: 'Toggle terminal', hint: 'Ctrl J', run: () => P.toggleTerminal() },
        { label: 'Toggle explorer', hint: 'Ctrl B', run: () => P.toggleExplorer() },
        {
          label: 'Download CV',
          hint: 'PDF',
          run: () => document.querySelector('.titlebar__cv').click(),
        },
        {
          label: 'Copy email address',
          hint: 'contact',
          run: () => P.copyText('nazima.jumaniyazova.95@gmail.com'),
        },
        {
          label: 'Open GitHub',
          hint: 'link',
          run: openUrl('https://github.com/nazimajumaniyazova'),
        },
        {
          label: 'Open LinkedIn',
          hint: 'link',
          run: openUrl('https://www.linkedin.com/in/nazima-jumaniyazova-7708a5269/'),
        },
        { label: 'Open Telegram', hint: 'link', run: openUrl('https://t.me/nazima_jm') },
      ],
    );

  let results = [];
  let selected = 0;
  let lastFocus = null;

  // 0 for a direct substring match, 1 when the letters appear in order.
  function rank(label, query) {
    const text = label.toLowerCase();
    if (text.includes(query)) return 0;
    let position = 0;
    for (const char of query) {
      position = text.indexOf(char, position);
      if (position === -1) return -1;
      position += 1;
    }
    return 1;
  }

  function render() {
    const query = input.value.trim().toLowerCase();
    results = items
      .map((item) => ({ item, score: query ? rank(item.label, query) : 0 }))
      .filter((entry) => entry.score !== -1)
      .sort((a, b) => a.score - b.score)
      .map((entry) => entry.item);
    selected = Math.min(selected, Math.max(0, results.length - 1));

    list.textContent = '';
    if (!results.length) {
      const none = document.createElement('li');
      none.className = 'palette__none';
      none.textContent = 'Nothing found';
      list.append(none);
      input.removeAttribute('aria-activedescendant');
      return;
    }

    results.forEach((item, index) => {
      const option = document.createElement('li');
      option.className = 'palette__item';
      option.id = 'palette-option-' + index;
      option.dataset.index = index;
      option.dataset.ext = item.ext || 'cmd';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', String(index === selected));
      option.append(item.label);
      const hint = document.createElement('small');
      hint.textContent = item.hint;
      option.append(hint);
      list.append(option);
      if (index === selected) {
        option.scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', option.id);
      }
    });
  }

  function open() {
    if (!palette.hidden) return close();
    lastFocus = document.activeElement;
    palette.hidden = false;
    input.value = '';
    selected = 0;
    render();
    input.focus();
  }

  function close() {
    palette.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function choose(index) {
    const item = results[index];
    if (!item) return;
    close();
    item.run();
  }

  input.addEventListener('input', () => {
    selected = 0;
    render();
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      selected = (selected + step + results.length) % Math.max(1, results.length);
      render();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(selected);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      // The input is the only focusable element in the dialog.
      event.preventDefault();
    }
  });

  palette.addEventListener('click', (event) => {
    if (event.target.closest('[data-palette-close]')) return close();
    const option = event.target.closest('.palette__item');
    if (option) choose(Number(option.dataset.index));
  });

  P.openPalette = open;
})();
