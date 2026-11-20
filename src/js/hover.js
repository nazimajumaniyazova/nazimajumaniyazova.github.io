// Hover cards for skills, like the type hints in an IDE: where each skill was
// used, built from the experience and project files on the page.
(function () {
  'use strict';

  const P = window.Portfolio;
  const panes = document.getElementById('panes');
  // The editor body holds both editor groups (see split.js).
  const area = document.getElementById('editor-body') || panes;
  if (!P || !panes) return;

  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));
  const flat = (el) => el.textContent.replace(/\s+/g, ' ').trim();
  const unquote = (text) => text.replace(/['"]/g, '').trim();
  const esc = (text) =>
    String(text).replace(
      /[&<>"]/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char],
    );

  // "JavaScript (ES6+)" -> "JavaScript", "React 18" -> "React".
  const baseName = (text) =>
    unquote(text)
      .replace(/\s*\(.*?\)/, '')
      .replace(/\s+\d+$/, '')
      .trim();

  // Category of every skill, from the keys of skills.json.
  const kinds = {};
  $$('#skills .l').forEach((line) => {
    const key = line.querySelector('.n');
    if (!key) return;
    $$('.skill', line).forEach((skill) => {
      kinds[baseName(skill.textContent).toLowerCase()] = unquote(key.textContent);
    });
  });

  // Places a skill can be used at: each job, each project, mentoring.
  const places = [];

  let job = null;
  $$('#experience .file__source .l').forEach((line) => {
    const text = flat(line);
    if (line.classList.contains('i1') && text === '{') {
      job = { label: '', sub: '', id: 'experience', n: line.dataset.n, text: '' };
      places.push(job);
      return;
    }
    if (!job) return;
    if (text === '];') {
      job = null;
      return;
    }
    const key = line.querySelector('.n');
    const value = line.querySelector('.s');
    if (key && value && key.textContent === 'company') {
      job.label = unquote(value.textContent);
      job.n = line.dataset.n;
    }
    if (key && value && key.textContent === 'period') job.sub = unquote(value.textContent);
    job.text += ' ' + text;
  });

  P.files
    .filter((file) => file.path.startsWith('projects/'))
    .forEach((file) => {
      const name = file.el.querySelector('.file__source h2');
      places.push({
        label: name ? unquote(flat(name).replace(/^name=/, '')) : file.name,
        sub: 'project',
        id: file.id,
        n: name ? name.dataset.n : 1,
        text: $$('.file__source .l', file.el).map(flat).join(' '),
      });
    });

  const mentoring = document.getElementById('mentoring');
  if (mentoring) {
    const since = mentoring.querySelector('.file__source .c');
    places.push({
      label: 'RS School mentoring',
      sub: since ? flat(since) : '',
      id: 'mentoring',
      n: 1,
      text: $$('.file__source .l', mentoring).map(flat).join(' '),
    });
  }

  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function placesFor(skill) {
    const pattern = new RegExp('(^|[^a-z0-9])' + escapeRegExp(skill) + '(?![a-z0-9])', 'i');
    return places.filter((place) => place.label && pattern.test(place.text));
  }

  // ---------- The card ----------

  const card = document.createElement('div');
  card.className = 'hover-card';
  card.hidden = true;
  document.body.append(card);

  let current = null;
  let showTimer;
  let hideTimer;

  function fill(skillEl) {
    const skill = baseName(skillEl.textContent);
    const kind = kinds[skill.toLowerCase()];
    const used = placesFor(skill);
    const mentions = P.search ? P.search(skill).total : 0;

    let html =
      '<p class="hover-card__head"><span class="hover-card__name">' +
      esc(skill) +
      '</span>' +
      (kind ? '<span class="hover-card__kind">' + esc(kind) + '</span>' : '') +
      '</p>';

    if (used.length) {
      html +=
        '<p class="hover-card__label">Used at</p><ul class="hover-card__list">' +
        used
          .map(
            (place) =>
              '<li><button type="button" data-goto="' +
              place.id +
              ':' +
              place.n +
              '"><span>' +
              esc(place.label) +
              '</span><small>' +
              esc(place.sub) +
              '</small></button></li>',
          )
          .join('') +
        '</ul>';
    } else {
      html += '<p class="hover-card__none">Part of my everyday toolkit.</p>';
    }

    if (mentions > 1) {
      html +=
        '<button class="hover-card__find" type="button" data-search="' +
        esc(skill) +
        '">Find all ' +
        mentions +
        ' mentions</button>';
    }
    card.innerHTML = html;
  }

  function position(skillEl) {
    const rect = skillEl.getBoundingClientRect();
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 6);
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  function show(skillEl) {
    clearTimeout(hideTimer);
    if (current) current.classList.remove('is-hovered');
    current = skillEl;
    current.classList.add('is-hovered');
    fill(skillEl);
    card.hidden = false;
    position(skillEl);
  }

  function hide() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    card.hidden = true;
    if (current) current.classList.remove('is-hovered');
    current = null;
  }

  const hideSoon = () => {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 220);
  };

  // ---------- Events ----------

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  area.addEventListener('mouseover', (event) => {
    if (!finePointer.matches) return;
    const skill = event.target.closest('.skill');
    if (!skill) return;
    clearTimeout(hideTimer);
    if (skill === current) return;
    clearTimeout(showTimer);
    // Moving from one skill to the next swaps the card right away.
    showTimer = setTimeout(() => show(skill), current ? 0 : 250);
  });

  area.addEventListener('mouseout', (event) => {
    // Phones send a mouseout right after a tap; there the card stays until
    // the next tap.
    if (!finePointer.matches || !event.target.closest('.skill')) return;
    clearTimeout(showTimer);
    if (current) hideSoon();
  });

  card.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  card.addEventListener('mouseleave', hideSoon);

  // Tap (or click) opens the card too, which is how it works on phones.
  document.addEventListener('click', (event) => {
    const skill = event.target.closest('.editor__body .skill');
    if (skill) {
      if (skill === current && !card.hidden) hide();
      else show(skill);
      return;
    }
    if (event.target.closest('.hover-card button') || !event.target.closest('.hover-card')) {
      hide();
    }
  });

  panes.addEventListener('scroll', hide, { passive: true });
  const side = document.getElementById('side-scroll');
  if (side) side.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('resize', hide);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });
})();
