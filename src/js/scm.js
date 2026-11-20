// Source control view (Ctrl Shift G): my path as a commit graph. Work is on
// the "main" branch, certificates on a "learning" branch next to it. Clicking
// a commit opens the file it "added" and marks those lines like a diff.
(function () {
  'use strict';

  const P = window.Portfolio;
  const list = document.getElementById('scm-list');
  if (!P || !list) return;

  // Newest first. "target" says which lines of which file the commit added:
  // a job block in experience.ts (company), one certificate (match) or a whole file.
  const COMMITS = [
    {
      hash: 'f3a91d0',
      date: 'May 2026',
      lane: 1,
      message: 'cert: Meta Front-End Developer',
      target: { file: 'certificates', match: 'Meta Front-End Developer' },
    },
    {
      hash: '7c2e5b8',
      date: 'Mar 2026',
      lane: 1,
      message: 'cert: Meta React Specialization',
      target: { file: 'certificates', match: 'Meta React Specialization' },
    },
    {
      hash: '5d81a3f',
      date: 'Mar 2026',
      lane: 1,
      message: 'cert: Principles of UX/UI Design',
      target: { file: 'certificates', match: 'Principles of UX/UI Design' },
    },
    {
      hash: 'c08d3f2',
      date: 'Dec 2025',
      lane: 0,
      message: 'Frontend Mentor, The Rolling Scopes School',
      target: { file: 'mentoring' },
    },
    {
      hash: 'e41b7a9',
      date: 'Sep 2025',
      lane: 0,
      message: 'Frontend Software Engineer, PLATMA',
      target: { file: 'experience', company: 'PLATMA' },
    },
    {
      hash: '2b6f0e4',
      date: 'Jun 2025',
      lane: 1,
      message: 'cert: Version Control',
      target: { file: 'certificates', match: 'Version Control' },
    },
    {
      hash: '8e3c7a1',
      date: 'May 2025',
      lane: 1,
      message: 'cert: Programming with JavaScript',
      target: { file: 'certificates', match: 'Programming with JavaScript' },
    },
    {
      hash: '41d9b2c',
      date: 'Nov 2023',
      lane: 1,
      message: 'cert: Introduction to Front-End Development',
      target: { file: 'certificates', match: 'Introduction to Front-End Development' },
    },
    {
      hash: 'a3f9c21',
      date: 'Sep 2023',
      lane: 0,
      message: 'Frontend Software Engineer, Asakabank',
      target: { file: 'experience', company: 'Asakabank' },
    },
    {
      hash: '6fa0d17',
      date: '2023',
      lane: 1,
      message: 'cert: JavaScript / Front-end, RS School',
      target: { file: 'certificates', match: 'JavaScript / Front-end' },
    },
    {
      hash: '9d2e6b4',
      date: 'Sep 2021',
      lane: 0,
      message: 'Frontend Software Engineer, Brain Development',
      target: { file: 'experience', company: 'Brain Development' },
    },
    {
      hash: '0000001',
      date: '2017',
      lane: 0,
      message: 'init: BSc in Applied Mathematics and Computer Science, MSU',
      target: { file: 'education' },
    },
  ];

  const BRANCHES = { c08d3f2: 'main', f3a91d0: 'learning' };
  const flat = (el) => el.textContent.replace(/\s+/g, ' ').trim();

  // ---------- Lines a commit added ----------

  function linesFor(target) {
    const file = P.resolve(target.file);
    if (!file) return [];
    const lines = Array.from(file.el.querySelectorAll('.file__source .l'));

    if (target.match) return lines.filter((line) => flat(line).includes(target.match));

    if (target.company) {
      const at = lines.findIndex((line) => flat(line).includes("company: '" + target.company));
      if (at === -1) return [];
      let start = at;
      while (start > 0 && flat(lines[start]) !== '{') start -= 1;
      let end = at;
      while (end < lines.length - 1 && flat(lines[end]) !== '},') end += 1;
      return lines.slice(start, end + 1);
    }

    return lines.filter((line) => flat(line));
  }

  let marked = [];

  function clearDiff() {
    marked.forEach((line) => line.classList.remove('is-added'));
    marked = [];
  }

  function show(commit) {
    P.openFile(commit.target.file);
    clearDiff();
    marked = linesFor(commit.target);
    marked.forEach((line, index) => {
      line.style.setProperty('--d', index);
      line.classList.add('is-added');
    });
    if (marked[0]) marked[0].scrollIntoView({ block: marked.length > 6 ? 'start' : 'center' });
    list.querySelectorAll('[aria-current]').forEach((row) => row.removeAttribute('aria-current'));
    const row = list.querySelector('[data-commit="' + commit.hash + '"]');
    if (row) row.setAttribute('aria-current', 'true');
    P.flash(commit.hash + ' +' + marked.length + ' lines');
  }

  // Opening another file (or the same one again from elsewhere) hides the diff.
  document.addEventListener('portfolio:open', clearDiff);

  // ---------- The list and its graph ----------

  const SVG = 'http://www.w3.org/2000/svg';
  const svgEl = (name, attrs) => {
    const el = document.createElementNS(SVG, name);
    Object.keys(attrs).forEach((key) => el.setAttribute(key, attrs[key]));
    return el;
  };

  COMMITS.forEach((commit) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'scm__commit';
    button.dataset.commit = commit.hash;
    button.dataset.lane = commit.lane;

    const message = document.createElement('span');
    message.className = 'scm__message';
    message.textContent = commit.message;

    const meta = document.createElement('span');
    meta.className = 'scm__meta';
    meta.textContent = commit.hash + ' · ' + commit.date;
    if (BRANCHES[commit.hash]) {
      const branch = document.createElement('span');
      branch.className = 'scm__branch scm__branch--' + BRANCHES[commit.hash];
      branch.textContent = BRANCHES[commit.hash];
      meta.append(' ', branch);
    }

    button.title = commit.message + ' (' + commit.date + ')';
    button.append(message, meta);
    item.append(button);
    list.append(item);
  });

  // Lane x positions in px, and where the learning branch forks off main.
  const X = [14, 30];
  const lastLearning = COMMITS.reduce((last, commit, index) => (commit.lane ? index : last), 0);

  function drawGraph() {
    const rows = Array.from(list.querySelectorAll(':scope > li'));
    if (!rows.length || !rows[0].offsetHeight) return;
    const old = list.querySelector('.scm__graph');
    if (old) old.remove();

    const centers = rows.map((row) => row.offsetTop + row.offsetHeight / 2);
    const height = rows[rows.length - 1].offsetTop + rows[rows.length - 1].offsetHeight;
    const svg = svgEl('svg', {
      class: 'scm__graph',
      width: 44,
      height,
      viewBox: '0 0 44 ' + height,
      'aria-hidden': 'true',
    });

    const firstMain = COMMITS.findIndex((commit) => !commit.lane);
    const fork = centers[lastLearning + 1];
    svg.append(
      svgEl('path', {
        class: 'scm__lane scm__lane--0',
        d: 'M' + X[0] + ' ' + centers[firstMain] + 'V' + centers[centers.length - 1],
      }),
      svgEl('path', {
        class: 'scm__lane scm__lane--1',
        d:
          'M' +
          X[1] +
          ' ' +
          centers[0] +
          'V' +
          centers[lastLearning] +
          'C' +
          X[1] +
          ' ' +
          (fork - 6) +
          ' ' +
          X[0] +
          ' ' +
          (centers[lastLearning] + 8) +
          ' ' +
          X[0] +
          ' ' +
          fork,
      }),
    );

    COMMITS.forEach((commit, index) => {
      svg.append(
        svgEl('circle', {
          class: 'scm__dot scm__dot--' + commit.lane + (BRANCHES[commit.hash] ? ' is-head' : ''),
          cx: X[commit.lane],
          cy: centers[index],
          r: BRANCHES[commit.hash] ? 5 : 4,
        }),
      );
    });

    list.prepend(svg);
  }

  // The list has no size while its view is hidden, so draw when it shows up.
  new ResizeObserver(drawGraph).observe(list);

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-commit]');
    if (!button) return;
    show(COMMITS.find((commit) => commit.hash === button.dataset.commit));
  });

  P.commits = COMMITS;
  P.showCommit = (hash) => {
    const commit = COMMITS.find((item) => item.hash.startsWith(hash));
    if (commit) show(commit);
    return Boolean(commit);
  };
})();
