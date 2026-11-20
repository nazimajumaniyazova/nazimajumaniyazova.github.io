// Search across all files (Ctrl Shift F), shown as the second view of the
// side bar. Also used by the terminal "grep" command and the skill hover cards.
(function () {
  'use strict';

  const P = window.Portfolio;
  const form = document.querySelector('.search__form');
  const input = document.getElementById('search-input');
  const summary = document.getElementById('search-summary');
  const results = document.getElementById('search-results');
  if (!P || !input) return;

  const SUGGESTIONS = ['React', 'TypeScript', 'Jest', 'WebSocket', 'banking', 'mentor'];
  const MAX_HITS_PER_FILE = 30;
  const canHighlight = typeof Highlight === 'function' && 'highlights' in CSS;

  // Every source line of every file, with its text flattened to one line.
  const lines = P.files.flatMap((file) =>
    Array.from(file.el.querySelectorAll('.file__source .l')).map((el) => ({
      file,
      el,
      n: el.dataset.n,
      text: el.textContent.replace(/\s+/g, ' ').trim(),
    })),
  );

  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function search(query) {
    const q = String(query || '').trim();
    const result = { query: q, total: 0, groups: [] };
    if (q.length < 2) return result;

    const pattern = new RegExp(escapeRegExp(q), 'gi');
    lines.forEach((line) => {
      const matches = Array.from(line.text.matchAll(pattern));
      if (!matches.length) return;
      let group = result.groups[result.groups.length - 1];
      if (!group || group.file !== line.file) {
        group = { file: line.file, count: 0, hits: [] };
        result.groups.push(group);
      }
      group.count += matches.length;
      result.total += matches.length;
      group.hits.push({ line, index: matches[0].index, length: matches[0][0].length });
    });
    return result;
  }

  // ---------- Highlights inside the files (CSS Custom Highlight API) ----------

  function highlight(query) {
    if (!canHighlight) return;
    CSS.highlights.delete('search');
    const needle = query.toLowerCase();
    if (needle.length < 2) return;

    const ranges = [];
    P.files.forEach((file) => {
      const source = file.el.querySelector('.file__source');
      const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue.toLowerCase();
        let at = text.indexOf(needle);
        while (at !== -1) {
          const range = new Range();
          range.setStart(node, at);
          range.setEnd(node, at + needle.length);
          ranges.push(range);
          at = text.indexOf(needle, at + needle.length);
        }
      }
    });
    if (ranges.length) CSS.highlights.set('search', new Highlight(...ranges));
  }

  // ---------- Results list ----------

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function snippet(hit) {
    const text = hit.line.text;
    // Short lead-in, so the match stays visible in the narrow side bar.
    const start = Math.max(0, hit.index - 10);
    const end = hit.index + hit.length;
    const button = make('button', 'search__hit');
    button.type = 'button';
    button.dataset.goto = hit.line.file.id + ':' + hit.line.n;
    button.title = hit.line.file.path + ', line ' + hit.line.n;
    button.append(
      (start > 0 ? '…' : '') + text.slice(start, hit.index),
      make('mark', '', text.slice(hit.index, end)),
      text.slice(end),
    );
    return button;
  }

  function renderSuggestions() {
    const box = make('div', 'search__try');
    box.append(make('p', '', 'Try one of these:'));
    SUGGESTIONS.forEach((word) => {
      const button = make('button', 'search__chip', word);
      button.type = 'button';
      button.dataset.search = word;
      box.append(button);
    });
    results.append(box);
  }

  const plural = (count, word) => count + ' ' + word + (count === 1 ? '' : 's');

  function render() {
    const result = search(input.value);
    highlight(result.query);
    results.textContent = '';

    if (!result.query) {
      summary.textContent = '';
      renderSuggestions();
      return result;
    }
    if (result.query.length < 2) {
      summary.textContent = 'Type at least 2 characters.';
      return result;
    }
    if (!result.total) {
      summary.textContent = 'No results for “' + result.query + '”.';
      return result;
    }

    summary.textContent =
      plural(result.total, 'result') + ' in ' + plural(result.groups.length, 'file');

    result.groups.forEach((group) => {
      const section = make('section', 'search__group');
      const head = make('button', 'search__file');
      head.type = 'button';
      head.dataset.ext = group.file.ext;
      head.dataset.goto = group.file.id + ':' + group.hits[0].line.n;
      const folder = group.file.path.split('/').slice(0, -1).join('/');
      head.append(
        make('span', 'search__name', group.file.name),
        make('span', 'search__dir', folder),
        make('span', 'search__count', String(group.count)),
      );
      const list = make('ul');
      group.hits.slice(0, MAX_HITS_PER_FILE).forEach((hit) => {
        const item = make('li');
        item.append(snippet(hit));
        list.append(item);
      });
      section.append(head, list);
      results.append(section);
    });
    return result;
  }

  // ---------- Jumping to a line ----------

  function goTo(fileId, lineNumber) {
    if (!P.openFile(fileId)) return;
    const line = P.getActive().el.querySelector('.l[data-n="' + lineNumber + '"]');
    if (!line) return;
    document
      .querySelectorAll('.l.is-current')
      .forEach((item) => item.classList.remove('is-current'));
    line.classList.add('is-current');
    line.scrollIntoView({ block: 'center' });
    line.classList.remove('is-found');
    void line.offsetWidth; // restarts the flash animation
    line.classList.add('is-found');
  }

  function searchFor(query) {
    P.showView('search');
    input.value = query;
    render();
  }

  // ---------- Events ----------

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && input.value) {
      event.preventDefault();
      event.stopPropagation();
      input.value = '';
      render();
    }
  });

  // Enter opens the first result.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const first = results.querySelector('[data-goto]');
    if (first) first.click();
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-goto], [data-search]');
    if (!target) return;
    if (target.dataset.goto) {
      const [fileId, lineNumber] = target.dataset.goto.split(':');
      goTo(fileId, lineNumber);
    } else {
      searchFor(target.dataset.search);
    }
  });

  render();

  P.search = search;
  P.searchFor = searchFor;
  P.goTo = goTo;
})();
