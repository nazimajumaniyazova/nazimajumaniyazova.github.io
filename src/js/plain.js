// Simple view: the same content as a regular one-page resume, for visitors
// who do not live in code editors. Everything is read from the files on the
// page, so there is one source of truth. Open it with the button in the title
// bar, the palette, the "plain" terminal command or a ?view=plain link.
(function () {
  'use strict';

  const P = window.Portfolio;
  const root = document.documentElement;
  const page = document.getElementById('plain');
  if (!P || !page) return;

  const KEY = 'view';
  const HINT_KEY = 'plain-hint';
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));
  // i18n.js adds P.t; without it every text stays in English.
  const t = (text) => (P.t ? P.t(text) : text);
  const flat = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const unquote = (text) =>
    text
      .replace(/,$/, '')
      .replace(/^['"]|['"]$/g, '')
      .trim();
  const esc = (text) =>
    String(text).replace(
      /[&<>"]/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char],
    );
  const external = (url, label, className) =>
    '<a' +
    (className ? ' class="' + className + '"' : '') +
    ' href="' +
    esc(url) +
    '" target="_blank" rel="noopener noreferrer">' +
    esc(label) +
    '</a>';

  // Labels for the keys of skills.json.
  const GROUPS = {
    languages: 'Programming languages',
    frameworks: 'Frameworks',
    ui: 'UI libraries',
    styling: 'Styling',
    forms: 'Forms',
    testing: 'Testing',
    performance: 'Performance',
    data: 'Data and APIs',
    tooling: 'Tooling',
    practices: 'Practices',
  };

  // ---------- Reading the files ----------

  // Key and value of a line like `role: 'Frontend'` or `"name": "Meta"`.
  const valueOf = (key) => {
    let el = key.nextElementSibling;
    while (el && el.classList.contains('m')) el = el.nextElementSibling;
    return el;
  };

  function readme() {
    const lines = $$('#readme .file__source > p.l');
    const photo = $('#readme .hero-card__photo img');
    return {
      name: flat($('#readme h1')).replace(/^#\s*/, ''),
      role: flat(lines[0]).replace(/^>\s*/, ''),
      summary: flat(lines[1]),
      photo: photo ? { src: photo.getAttribute('src'), alt: photo.alt } : null,
    };
  }

  function about() {
    return {
      text: $$('#about .file__source > p.l')
        .filter((line) => !line.querySelector('.c'))
        .map(flat),
      now: $$('#about li.l').map((line) => flat(line).replace(/^-\s*/, '')),
    };
  }

  function jobs() {
    const list = [];
    let job = null;
    let inDid = false;
    $$('#experience .file__source .l').forEach((line) => {
      const text = flat(line);
      if (line.classList.contains('i1') && text === '{') {
        job = { did: [], stack: [] };
        list.push(job);
        return;
      }
      if (!job) return;
      const key = line.querySelector('.n');
      const name = key ? key.textContent.trim() : '';
      if (name === 'did') {
        inDid = true;
        return;
      }
      if (inDid && line.classList.contains('i3')) {
        const link = line.querySelector('a[href^="#"]');
        job.did.push({ text: unquote(text), project: link ? link.hash.slice(1) : null });
        return;
      }
      inDid = false;
      if (name === 'stack') job.stack = $$('.skill', line).map((skill) => unquote(flat(skill)));
      else if (name) job[name] = unquote(flat(valueOf(key)));
    });
    return list;
  }

  function projects() {
    return P.files
      .filter((file) => file.path.startsWith('projects/'))
      .map((file) => {
        const project = { id: file.id, stack: [] };
        $$('.file__source .l', file.el).forEach((line) => {
          const key = line.querySelector('.n');
          if (!key) return;
          const name = key.textContent.trim();
          if (name === 'stack') {
            project.stack = $$('.skill', line).map((skill) => unquote(flat(skill)));
            return;
          }
          const value = valueOf(key);
          if (!value) return;
          project[name] = value.tagName === 'A' ? value.href : unquote(flat(value));
        });
        const shot = $('.file__preview img', file.el);
        if (shot) project.shot = { src: shot.getAttribute('src'), alt: shot.alt };
        return project;
      });
  }

  function skills() {
    return $$('#skills li.l').map((line) => ({
      group: unquote(flat($('.n', line))),
      items: $$('.skill', line).map((skill) => unquote(flat(skill))),
    }));
  }

  function mentoring() {
    const lines = $$('#mentoring .file__source > p.l');
    const head = lines.find((line) => line.querySelector('strong'));
    return {
      title: flat($('strong', head)).replace(/\*/g, ''),
      period: flat($('.c', head)),
      text: lines
        .filter((line) => line !== head && !/^>/.test(flat(line)))
        .map(flat)
        .filter(Boolean),
      points: $$('#mentoring li.l').map((line) => flat(line).replace(/^-\s*/, '')),
      quote: flat(lines.find((line) => /^>/.test(flat(line)))).replace(/^>\s*/, ''),
    };
  }

  function education() {
    const lines = $$('#education .file__source > p.l');
    const head = lines.find((line) => line.querySelector('strong'));
    const at = lines.indexOf(head);
    return {
      school: flat($('strong', head)).replace(/\*/g, ''),
      degree: flat(lines[at + 1]),
      year: flat(lines[at + 2]),
    };
  }

  // Lines of key/value pairs: certificates.json, languages.yml, contact.ts.
  function records(selector) {
    return $$(selector).map((line) => {
      const record = {};
      $$('.n', line).forEach((key) => {
        const value = valueOf(key);
        if (!value) return;
        const name = unquote(flat(key));
        record[name] =
          value.tagName === 'A'
            ? { href: value.getAttribute('href'), text: unquote(flat(value)) }
            : unquote(flat(value));
      });
      return record;
    });
  }

  // ---------- The page ----------

  const section = (id, title, body) =>
    '<section class="plain__section" id="plain-' +
    id +
    '" aria-labelledby="plain-' +
    id +
    '-title"><h2 class="plain__title" id="plain-' +
    id +
    '-title"><span aria-hidden="true">## </span>' +
    esc(title) +
    '</h2>' +
    body +
    '</section>';

  const tags = (items) =>
    items.length
      ? '<ul class="plain__tags">' +
        items.map((item) => '<li>' + esc(item) + '</li>').join('') +
        '</ul>'
      : '';

  const list = (items, className) =>
    '<ul class="' +
    (className || 'plain__list') +
    '">' +
    items.map((item) => '<li>' + item + '</li>').join('') +
    '</ul>';

  function render() {
    const me = readme();
    const contact = Object.assign({}, ...records('#contact li.l'));
    const cv = $('.titlebar__cv');
    const sections = [
      ['about', 'About'],
      ['experience', 'Experience'],
      ['projects', 'Projects'],
      ['skills', 'Skills'],
      ['mentoring', 'Mentoring'],
      ['education', 'Education'],
      ['certificates', 'Certificates'],
      ['languages', 'Languages'],
      ['contact', 'Contact'],
    ];

    const links = [
      contact.email &&
        '<a href="' + esc(contact.email.href) + '">' + esc(contact.email.text) + '</a>',
      contact.linkedin && external(contact.linkedin.href, 'LinkedIn'),
      contact.telegram && external(contact.telegram.href, 'Telegram'),
      contact.github && external(contact.github.href, 'GitHub'),
    ].filter(Boolean);

    const hero =
      '<header class="plain__hero">' +
      (me.photo
        ? '<img class="plain__photo" src="' +
          esc(me.photo.src) +
          '" width="640" height="800" alt="' +
          esc(me.photo.alt) +
          '" />'
        : '') +
      '<div class="plain__intro">' +
      '<h1 class="plain__name" id="plain-name" tabindex="-1">' +
      esc(me.name) +
      '</h1>' +
      '<p class="plain__role">' +
      esc(me.role) +
      '</p>' +
      '<p class="plain__summary">' +
      esc(me.summary) +
      '</p>' +
      list(links, 'plain__links') +
      '</div></header>' +
      '<nav class="plain__toc" aria-label="' +
      esc(t('Sections')) +
      '">' +
      sections
        .map((item) => '<a href="#plain-' + item[0] + '">' + esc(t(item[1])) + '</a>')
        .join('') +
      '</nav>';

    const me2 = about();
    const aboutHtml =
      me2.text.map((text) => '<p>' + esc(text) + '</p>').join('') +
      '<h3 class="plain__sub">' +
      esc(t('Right now')) +
      '</h3>' +
      list(me2.now.map(esc));

    const jobsHtml = jobs()
      .map(
        (job) =>
          '<article class="plain__item">' +
          '<p class="plain__when">' +
          esc(job.period || '') +
          '<span>' +
          esc(job.place || '') +
          '</span></p>' +
          '<div class="plain__what">' +
          '<h3 class="plain__head">' +
          esc(job.role || '') +
          ' <span class="plain__at">' +
          esc(job.company || '') +
          '</span></h3>' +
          list(
            job.did.map((item) =>
              item.project
                ? '<a href="#plain-p-' + esc(item.project) + '">' + esc(item.text) + '</a>'
                : esc(item.text),
            ),
          ) +
          tags(job.stack) +
          '</div></article>',
      )
      .join('');

    const projectsHtml =
      '<div class="plain__cards">' +
      projects()
        .map(
          (project) =>
            '<article class="plain__card" id="plain-p-' +
            esc(project.id) +
            '">' +
            (project.shot
              ? '<img src="' +
                esc(project.shot.src) +
                '" width="1280" height="800" loading="lazy" alt="' +
                esc(project.shot.alt) +
                '" />'
              : '') +
            '<h3 class="plain__head">' +
            (project.url
              ? external(project.url, project.name || project.id)
              : esc(project.name || project.id)) +
            '</h3>' +
            (project.role ? '<p class="plain__meta">' + esc(project.role) + '</p>' : '') +
            (project.about ? '<p>' + esc(project.about) + '</p>' : '') +
            tags(project.stack) +
            (project.code
              ? '<p class="plain__more">' + external(project.code, t('Source code')) + '</p>'
              : '') +
            '</article>',
        )
        .join('') +
      '</div>';

    const skillsHtml =
      '<dl class="plain__skills">' +
      skills()
        .map(
          (group) =>
            '<div><dt>' +
            esc(t(GROUPS[group.group] || group.group)) +
            '</dt><dd>' +
            tags(group.items) +
            '</dd></div>',
        )
        .join('') +
      '</dl>';

    const mentor = mentoring();
    const mentorHtml =
      '<article class="plain__item">' +
      '<p class="plain__when">' +
      esc(mentor.period) +
      '</p><div class="plain__what"><h3 class="plain__head">' +
      esc(mentor.title) +
      '</h3>' +
      mentor.text.map((text) => '<p>' + esc(text) + '</p>').join('') +
      list(mentor.points.map(esc)) +
      (mentor.quote ? '<blockquote>' + esc(mentor.quote) + '</blockquote>' : '') +
      '</div></article>';

    const school = education();
    const educationHtml =
      '<article class="plain__item"><p class="plain__when">' +
      esc(school.year) +
      '</p><div class="plain__what"><h3 class="plain__head">' +
      esc(school.school) +
      '</h3><p>' +
      esc(school.degree) +
      '</p></div></article>';

    const certificatesHtml = list(
      records('#certificates li.l').map(
        (cert) =>
          '<strong>' +
          esc(cert.name || '') +
          '</strong> <span class="plain__meta">' +
          esc([cert.by, cert.issued].filter(Boolean).join(', ')) +
          '</span>' +
          (cert.verify && cert.verify.href
            ? ' ' + external(cert.verify.href, t('verify'), 'plain__verify')
            : ''),
      ),
      'plain__list plain__list--loose',
    );

    const languagesHtml = list(
      $$('#languages li.l').map(
        (line) =>
          '<strong>' +
          esc(unquote(flat($('.n', line)))) +
          '</strong> <span class="plain__meta">' +
          esc(flat($('.s', line))) +
          '</span>',
      ),
    );

    const contactHtml =
      list(
        ['email', 'linkedin', 'telegram', 'github']
          .filter((key) => contact[key])
          .map(
            (key) =>
              '<span class="plain__key">' +
              esc(
                { email: 'Email', linkedin: 'LinkedIn', telegram: 'Telegram', github: 'GitHub' }[
                  key
                ],
              ) +
              '</span> ' +
              (key === 'email'
                ? '<a href="' + esc(contact.email.href) + '">' + esc(contact.email.text) + '</a>'
                : external(contact[key].href, contact[key].text)),
          )
          .concat(
            contact.location
              ? [
                  '<span class="plain__key">' +
                    esc(t('Location')) +
                    '</span> ' +
                    esc(contact.location),
                ]
              : [],
          ),
        'plain__list plain__list--contact',
      ) +
      (contact.email
        ? '<p><a class="plain__button" href="' +
          esc(contact.email.href) +
          '">' +
          esc(t('Write me an email')) +
          '</a></p>'
        : '');

    page.innerHTML =
      '<div class="plain__bar">' +
      '<button class="plain__back" type="button" data-action="plain">' +
      '<span aria-hidden="true">&lt;/&gt;</span> ' +
      esc(t('Editor view')) +
      '</button>' +
      '<span class="plain__spacer"></span>' +
      '<span class="plain__tools"></span>' +
      '<button class="icon-btn" type="button" data-action="theme" aria-label="' +
      esc(t('Change color theme')) +
      '" title="' +
      esc(t('Change color theme')) +
      '"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" />' +
      '<path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" /></svg></button>' +
      (cv
        ? '<a class="plain__cv" href="' +
          esc(cv.getAttribute('href')) +
          '" download>' +
          esc(t('Download CV')) +
          '</a>'
        : '') +
      '</div>' +
      '<main class="plain__page" id="plain-main">' +
      hero +
      section('about', t('About'), aboutHtml) +
      section('experience', t('Experience'), jobsHtml) +
      section('projects', t('Projects'), projectsHtml) +
      section('skills', t('Skills'), skillsHtml) +
      section('mentoring', t('Mentoring'), mentorHtml) +
      section('education', t('Education'), educationHtml) +
      section('certificates', t('Certificates'), certificatesHtml) +
      section('languages', t('Languages'), languagesHtml) +
      section('contact', t('Contact'), contactHtml) +
      '<footer class="plain__footer"><p>' +
      esc(t('This is the simple view of a portfolio built like a code editor.')) +
      ' <button type="button" data-action="plain">' +
      esc(t('Open the editor view')) +
      '</button></p></footer>' +
      '</main>';
    built = true;
    document.dispatchEvent(new CustomEvent('portfolio:plain-render'));
  }

  // ---------- Switching ----------

  let built = false;
  const isOn = () => root.classList.contains('plain-view');

  function save(on) {
    try {
      if (on) localStorage.setItem(KEY, 'plain');
      else localStorage.removeItem(KEY);
    } catch (e) {
      // Private mode: the view resets on the next visit.
    }
  }

  function setPlain(on) {
    if (on && !built) render();
    root.classList.toggle('plain-view', on);
    save(on);
    dismissHint();
    // A shared ?view=plain link should not keep forcing the view after a switch.
    if (!on && /[?&]view=plain/.test(location.search)) {
      try {
        history.replaceState(null, '', location.pathname + location.hash);
      } catch (e) {
        // file:// pages may refuse history changes.
      }
    }
    if (on) {
      window.scrollTo(0, 0);
      const name = document.getElementById('plain-name');
      if (name) name.focus({ preventScroll: true });
    } else {
      document.dispatchEvent(new CustomEvent('portfolio:settings'));
    }
    return on;
  }

  const togglePlain = () => setPlain(!isOn());

  // The content can change (another language), so rebuild when it does.
  document.addEventListener('portfolio:content', () => {
    built = false;
    if (isOn()) render();
  });

  // ---------- A one-time hint for visitors who are not developers ----------

  let hint = null;

  function dismissHint() {
    if (hint) {
      hint.remove();
      hint = null;
    }
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch (e) {
      // ignore
    }
  }

  function showHint() {
    let seen = false;
    try {
      seen = Boolean(localStorage.getItem(HINT_KEY));
    } catch (e) {
      seen = true;
    }
    if (seen || isOn()) return;
    hint = document.createElement('div');
    hint.className = 'notice';
    hint.setAttribute('role', 'status');
    hint.innerHTML =
      '<p class="notice__text">' +
      esc(t('Not a developer? The same resume is also a regular page.')) +
      '</p><div class="notice__actions"><button class="notice__primary" type="button" data-action="plain">' +
      esc(t('Open simple view')) +
      '</button><button class="notice__close" type="button" aria-label="' +
      esc(t('Close')) +
      '">×</button></div>';
    hint.querySelector('.notice__close').addEventListener('click', dismissHint);
    document.body.append(hint);
  }

  if (P.terminal) {
    P.terminal.addCommand('plain', {
      about: 'my resume as a regular page',
      run: () => (setPlain(true), 'Opening the simple view'),
    });
  }

  if (isOn()) render();
  else setTimeout(showHint, 4000);

  P.setPlain = setPlain;
  P.togglePlain = togglePlain;
  P.isPlain = isOn;
})();
