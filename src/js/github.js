// github/repos.json: my public repositories, loaded live from the GitHub API
// the first time the file is opened. The answer is kept in localStorage for
// an hour, so the anonymous API limit (60 requests an hour) is never a problem.
// Forks are left out. The terminal gets `gh repo list`.
(function () {
  'use strict';

  const P = window.Portfolio;
  const file = document.getElementById('github');
  if (!P || !file) return;

  const USER = 'nazimajumaniyazova';
  const PROFILE = 'https://github.com/' + USER;
  const API = 'https://api.github.com/users/' + USER + '/repos?per_page=100&sort=pushed';
  const CACHE_KEY = 'github-repos';
  const CACHE_AGE = 60 * 60 * 1000;
  const SHOWN = 12;
  const CARDS = 6;

  // Colors GitHub uses for the languages I write in.
  const COLORS = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    HTML: '#e34c26',
    CSS: '#663399',
    SCSS: '#c6538c',
    Vue: '#41b883',
  };

  const source = file.querySelector('.file__source');
  const cards = file.querySelector('.repos');
  const t = (text) => (P.t ? P.t(text) : text);
  const esc = (text) =>
    String(text).replace(
      /[&<>"]/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char],
    );
  // URLs come from the API (a repo's homepage is free text) or from the
  // cache, so only http and https become links; anything else stays text.
  const safeUrl = (url) => {
    try {
      const parsed = new URL(String(url));
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
    } catch (e) {
      return '';
    }
  };
  const link = (url, label, className) => {
    const href = safeUrl(url);
    if (!href)
      return '<span' + (className ? ' class="' + className + '"' : '') + '>' + label + '</span>';
    return (
      '<a' +
      (className ? ' class="' + className + '"' : '') +
      ' href="' +
      esc(href) +
      '" target="_blank" rel="noopener noreferrer">' +
      label +
      '</a>'
    );
  };

  let state = 'idle'; // idle | loading | ready | error
  let repos = [];
  let fetchedAt = 0;
  let showAll = false;
  let waiting = [];

  // ---------- Data ----------

  function readCache() {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY));
      return cache && Array.isArray(cache.repos) ? cache : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ time: fetchedAt, repos }));
    } catch (e) {
      // Private mode or a full storage: the next visit simply fetches again.
    }
  }

  // Only the fields the file shows, newest push first, without forks.
  function pick(list) {
    return list
      .filter((repo) => !repo.fork && repo.name.toLowerCase() !== USER)
      .sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at))
      .map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        about: (repo.description || '').trim(),
        language: repo.language || '',
        stars: repo.stargazers_count || 0,
        pushed: repo.pushed_at,
        live: repo.homepage || '',
      }));
  }

  function done() {
    render();
    waiting.forEach((callback) => callback());
    waiting = [];
  }

  function load(force) {
    if (state === 'loading') return;
    const cache = readCache();
    if (!force && cache && Date.now() - cache.time < CACHE_AGE) {
      repos = cache.repos;
      fetchedAt = cache.time;
      state = 'ready';
      return done();
    }
    state = 'loading';
    render();
    fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
      .then((response) => {
        if (!response.ok) throw new Error('GitHub answered ' + response.status);
        return response.json();
      })
      .then((list) => {
        repos = pick(list);
        fetchedAt = Date.now();
        state = 'ready';
        writeCache();
        done();
      })
      .catch(() => {
        // An old answer is better than nothing.
        if (cache) {
          repos = cache.repos;
          fetchedAt = cache.time;
          state = 'ready';
        } else {
          state = 'error';
        }
        done();
      });
  }

  // Runs the callback once the list is there (or failed).
  function whenLoaded(callback) {
    if (state === 'ready' || state === 'error') return callback();
    waiting.push(callback);
    load();
  }

  // ---------- Rendering ----------

  const date = (iso) => (iso ? iso.slice(0, 10) : '');
  const comment = (text) => '<p class="l"><span class="c">' + text + '</span></p>';
  const pair = (key, value) =>
    '<span class="n">"' + key + '"</span><span class="m">:</span> ' + value;
  const str = (text) => '<span class="s">"' + esc(text) + '"</span>';

  function repoLine(repo, last) {
    const parts = [
      pair('name', link(repo.url, '"' + esc(repo.name) + '"')),
      repo.about && pair('about', str(repo.about)),
      repo.language && pair('language', str(repo.language)),
      pair('updated', str(date(repo.pushed))),
      repo.stars && pair('stars', '<span class="k">' + repo.stars + '</span>'),
      repo.live &&
        pair('live', link(repo.live, '"' + esc(repo.live.replace(/^https?:\/\//, '')) + '"')),
    ].filter(Boolean);
    return (
      '<li class="l i1"><span class="m">{</span> ' +
      parts.join('<span class="m">,</span> ') +
      ' <span class="m">}' +
      (last ? '' : ',') +
      '</span></li>'
    );
  }

  function renderSource() {
    const head =
      '<h2 class="visually-hidden">' +
      esc(t('GitHub repositories')) +
      '</h2>' +
      '<p class="lens"><button type="button" data-github-refresh>' +
      esc(t('↻ Refresh')) +
      '</button><span aria-hidden="true">|</span>' +
      link(PROFILE, esc(t('Open on GitHub'))) +
      '</p>' +
      comment(esc(t('// My public repositories, live from the GitHub API.')));

    if (state === 'idle') return head + comment(esc(t('// Opening the file loads them.')));
    if (state === 'loading') return head + comment(esc(t('// Loading…')));
    if (state === 'error') {
      return (
        head +
        comment(esc(t('// GitHub is not answering right now (offline or rate limit).'))) +
        '<p class="l"><span class="c">// </span>' +
        link(PROFILE, 'github.com/' + USER) +
        ' <button class="github__more" type="button" data-github-refresh>' +
        esc(t('Try again')) +
        '</button></p>'
      );
    }

    const list = showAll ? repos : repos.slice(0, SHOWN);
    const hidden = repos.length - list.length;
    const time = new Date(fetchedAt).toLocaleTimeString(
      P.getLocale && P.getLocale() === 'ru' ? 'ru' : 'en-GB',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );
    return (
      head +
      comment(
        esc(
          t('// {count} repositories, forks left out. Fetched at {time}.')
            .replace('{count}', repos.length)
            .replace('{time}', time),
        ),
      ) +
      '<div class="l" aria-hidden="true"><span class="m">[</span></div>' +
      '<ul>' +
      list.map((repo, index) => repoLine(repo, index === list.length - 1)).join('') +
      '</ul>' +
      '<div class="l" aria-hidden="true"><span class="m">]</span></div>' +
      (hidden
        ? '<p class="l"><span class="c">' +
          esc(t('// {count} more.').replace('{count}', hidden)) +
          '</span> <button class="github__more" type="button" data-github-all>' +
          esc(t('Show all')) +
          '</button></p>'
        : '') +
      '<p class="l"><span class="c">' +
      esc(t('// more on')) +
      '</span> ' +
      link(PROFILE, 'github.com/' + USER) +
      '</p>'
    );
  }

  function renderCards() {
    if (state !== 'ready') {
      cards.innerHTML =
        '<p class="repos__note">' +
        esc(state === 'error' ? t('Could not load the repositories.') : t('Loading…')) +
        '</p>';
      return;
    }
    const locale = P.getLocale ? P.getLocale() : 'en';
    cards.innerHTML =
      '<p class="repos__head">' +
      link(PROFILE, esc('github.com/' + USER)) +
      '</p>' +
      repos
        .slice(0, CARDS)
        .map(
          (repo) =>
            '<article class="repo">' +
            '<h3 class="repo__name">' +
            link(repo.url, esc(repo.name)) +
            '</h3>' +
            (repo.about ? '<p class="repo__about">' + esc(repo.about) + '</p>' : '') +
            '<p class="repo__meta">' +
            (repo.language
              ? '<span class="repo__lang"><i style="background-color:' +
                (COLORS[repo.language] || 'var(--c-muted)') +
                '"></i>' +
                esc(repo.language) +
                '</span>'
              : '') +
            (repo.stars ? '<span>★ ' + repo.stars + '</span>' : '') +
            '<span>' +
            esc(
              new Date(repo.pushed).toLocaleDateString(locale, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            ) +
            '</span>' +
            (safeUrl(repo.live) ? link(repo.live, esc(t('Live'))) : '') +
            '</p></article>',
        )
        .join('');
  }

  function render(quiet) {
    source.innerHTML = renderSource();
    renderCards();
    // Line numbers for the status bar and the search (app.js does this once
    // for the files that are in the HTML from the start).
    source.querySelectorAll('.l').forEach((line, index) => {
      line.style.setProperty('--n', index);
      line.dataset.n = index + 1;
    });
    if (!quiet) {
      document.dispatchEvent(
        new CustomEvent('portfolio:content', { detail: { source: 'github' } }),
      );
    }
  }

  // ---------- Events ----------

  document.addEventListener('portfolio:open', (event) => {
    if (event.detail === 'github' && state === 'idle') load();
  });

  // Another language: build the text again (the dates and comments change).
  document.addEventListener('portfolio:content', (event) => {
    if (event.detail && event.detail.locale) render(true);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-github-refresh]')) {
      load(true);
    } else if (event.target.closest('[data-github-all]')) {
      showAll = true;
      render();
    }
  });

  render(true);
  if (P.getActive() && P.getActive().id === 'github') load();

  // ---------- Terminal ----------

  function table() {
    if (state === 'error') {
      return (
        '<span class="terminal__error">GitHub is not answering right now.</span> ' +
        link(PROFILE, 'github.com/' + USER)
      );
    }
    return (
      repos
        .map(
          (repo) =>
            link(repo.url, esc(repo.name)) +
            ' '.repeat(Math.max(1, 30 - repo.name.length)) +
            '<span class="s">' +
            esc(repo.language.padEnd(11)) +
            '</span> <span class="c">' +
            date(repo.pushed) +
            '</span>',
        )
        .join('\n') +
      '\n' +
      repos.length +
      ' repositories. ' +
      P.terminal.button('open repos.json')
    );
  }

  if (P.terminal) {
    P.terminal.addCommand('gh', {
      about: 'my GitHub repositories: gh repo list',
      run: (args) => {
        const sub = args.join(' ');
        if (sub === 'repo list' || sub === 'repos') {
          if (state === 'ready' || state === 'error') return table();
          whenLoaded(() => P.terminal.print(table()));
          return '<span class="c">Asking the GitHub API…</span>';
        }
        if (sub === 'browse') {
          window.open(PROFILE, '_blank', 'noopener');
          return 'Opening ' + link(PROFILE, 'github.com/' + USER);
        }
        return 'Try ' + P.terminal.button('gh repo list') + '  ' + P.terminal.button('gh browse');
      },
    });
  }

  P.github = { load, whenLoaded, repos: () => repos };
})();
