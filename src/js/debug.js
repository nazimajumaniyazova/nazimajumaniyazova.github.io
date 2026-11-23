// Run and Debug (F5): steps through my career like a program. Every stage has
// a breakpoint (education, each job, mentoring); at each stop the panel shows
// the variables and the call stack, read from the files on the page. F5 goes
// on, Shift F5 stops, Ctrl Shift F5 restarts, F10 steps over.
(function () {
  'use strict';

  const P = window.Portfolio;
  const root = document.documentElement;
  const panel = document.getElementById('debug-panel');
  const body = document.getElementById('editor-body');
  if (!P || !panel || !body) return;

  const desktop = window.matchMedia('(min-width: 48em)');
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));
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

  // ---------- Breakpoints, read from the files ----------

  // "Sep 2021", "сен 2021" or "present" as a month number.
  const MONTHS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  const MONTHS_RU = [
    'янв',
    'фев',
    'мар',
    'апр',
    'май',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ];

  function month(text) {
    const match = text
      .trim()
      .toLowerCase()
      .match(/^([a-zа-яё]+)\.?\s+(\d{4})$/);
    if (!match) return null;
    let index = MONTHS.indexOf(match[1].slice(0, 3));
    if (index === -1) index = MONTHS_RU.indexOf(match[1].slice(0, 3));
    return index === -1 ? null : Number(match[2]) * 12 + index;
  }

  // Whole years between the two ends of a period, "present" being today.
  function years(period) {
    const ends = period.split(/\s+[–-]\s+/);
    const now = new Date();
    const start = month(ends[0] || '');
    const end = ends[1] ? month(ends[1]) || now.getFullYear() * 12 + now.getMonth() : null;
    return start === null || end === null ? null : Math.round((end - start) / 12);
  }

  const lineOf = (file, el) => (el ? Number(el.closest('.l').dataset.n) : 1);

  function educationStop() {
    const lines = $$('#education .file__source > p.l');
    const head = lines.find((line) => line.querySelector('strong'));
    if (!head) return null;
    const at = lines.indexOf(head);
    const year = (flat(lines[at + 2]).match(/\d{4}/) || [])[0];
    return {
      file: 'education',
      line: head,
      frame: 'study()',
      vars: [
        ['university', flat($('strong', head)).replace(/\*/g, '')],
        ['degree', flat(lines[at + 1])],
        ['graduated', year ? Number(year) : flat(lines[at + 2])],
      ],
    };
  }

  function jobStops() {
    const jobs = [];
    let job = null;
    let did = null;
    $$('#experience .file__source .l').forEach((line) => {
      const text = flat(line);
      if (line.classList.contains('i1') && text === '{') {
        job = { did: [], stack: [] };
        jobs.push(job);
        return;
      }
      if (!job) return;
      const key = line.querySelector('.n');
      const name = key ? key.textContent.trim() : '';
      if (name === 'did') {
        did = job.did;
        return;
      }
      if (did && line.classList.contains('i3')) {
        did.push(unquote(text));
        return;
      }
      did = null;
      if (name === 'stack') job.stack = $$('.skill', line).map((skill) => unquote(flat(skill)));
      else if (name) {
        job[name] = unquote(flat(line.querySelector('.s')));
        if (name === 'company') job.line = line;
      }
    });

    // Oldest first, the way a career runs.
    return jobs
      .filter((item) => item.line)
      .reverse()
      .map((item) => ({
        file: 'experience',
        line: item.line,
        frame: "job('" + item.company + "')",
        vars: [
          ['company', item.company],
          ['role', item.role],
          ['period', item.period],
          ['place', item.place],
          ['years', years(item.period || '')],
          ['did', item.did],
          ['stack', item.stack],
        ],
      }));
  }

  function mentoringStop() {
    const head = $$('#mentoring .file__source > p.l').find((line) => line.querySelector('strong'));
    if (!head) return null;
    const parts = flat($('strong', head)).replace(/\*/g, '').split(/,\s*/);
    const since = flat($('.c', head)).split(/\s+[–-]\s+/)[0];
    return {
      file: 'mentoring',
      line: head,
      frame: 'mentor()',
      vars: [
        ['role', parts[0]],
        ['school', parts.slice(1).join(', ')],
        ['since', since],
      ],
    };
  }

  function readStops() {
    return [educationStop()].concat(jobStops(), [mentoringStop()]).filter(Boolean);
  }

  // ---------- State ----------

  let stops = readStops();
  let index = -1; // -1: not running
  const running = () => index !== -1;
  const fileName = (id) => (P.resolve(id) ? P.resolve(id).name : id);

  function where(stop) {
    return fileName(stop.file) + ':' + lineOf(stop.file, stop.line);
  }

  // ---------- Rendering ----------

  function valueHtml(value) {
    if (Array.isArray(value)) return '<span class="t">Array(' + value.length + ')</span>';
    if (typeof value === 'number') return '<span class="k">' + value + '</span>';
    if (value === null || value === undefined) return '<span class="k">undefined</span>';
    return '<span class="s">\'' + esc(value) + "'</span>";
  }

  function variablesHtml(stop) {
    return (
      '<ul class="debug__vars">' +
      stop.vars
        .map((pair) => {
          const name = '<span class="n">' + esc(pair[0]) + '</span><span class="m">: </span>';
          if (!Array.isArray(pair[1])) {
            return '<li class="debug__var">' + name + valueHtml(pair[1]) + '</li>';
          }
          return (
            '<li class="debug__var"><details><summary>' +
            name +
            valueHtml(pair[1]) +
            '</summary><ul>' +
            pair[1]
              .map(
                (item, i) =>
                  '<li class="debug__var"><span class="m">' +
                  i +
                  ': </span>' +
                  valueHtml(item) +
                  '</li>',
              )
              .join('') +
            '</ul></details></li>'
          );
        })
        .join('') +
      '</ul>'
    );
  }

  function section(title, html) {
    return (
      '<section class="debug__section"><h3 class="debug__title">' +
      esc(t(title)) +
      '</h3>' +
      html +
      '</section>'
    );
  }

  function renderPanel() {
    const stop = running() ? stops[index] : null;
    const start =
      '<div class="debug__start">' +
      (stop
        ? '<button class="debug__button debug__button--stop" type="button" data-debug="stop">■ ' +
          esc(t('Stop')) +
          ' <kbd>Shift F5</kbd></button>'
        : '<button class="debug__button" type="button" data-debug="start">▶ ' +
          esc(t('Start debugging')) +
          ' <kbd>F5</kbd></button>') +
      '<p class="debug__intro">' +
      esc(
        t(
          'Steps through my career like a program. Every stage is a breakpoint, the variables come from the files.',
        ),
      ) +
      '</p></div>';

    const variables = stop
      ? section('Variables', variablesHtml(stop))
      : section('Variables', '<p class="debug__empty">' + esc(t('Not running.')) + '</p>');

    const frames = stop
      ? [
          [stop.frame, where(stop)],
          ['career()', 'README.md:1'],
        ]
      : [];
    const stack = section(
      'Call stack',
      frames.length
        ? '<ol class="debug__frames">' +
            frames
              .map(
                (frame, i) =>
                  '<li' +
                  (i === 0 ? ' class="is-top"' : '') +
                  '><span class="f">' +
                  esc(frame[0]) +
                  '</span><span class="debug__where">' +
                  esc(frame[1]) +
                  '</span></li>',
              )
              .join('') +
            '</ol>'
        : '<p class="debug__empty">' + esc(t('Not running.')) + '</p>',
    );

    const breakpoints = section(
      'Breakpoints',
      '<ul class="debug__bps">' +
        stops
          .map(
            (item, i) =>
              '<li><button type="button" data-debug-goto="' +
              i +
              '"' +
              (i === index ? ' aria-current="true"' : '') +
              '><span class="debug__dot" aria-hidden="true"></span><span>' +
              esc(item.frame) +
              '</span><span class="debug__where">' +
              esc(where(item)) +
              '</span></button></li>',
          )
          .join('') +
        '</ul>',
    );

    panel.innerHTML =
      '<p class="debug__heading">' +
      esc(t('Run and Debug')) +
      '</p>' +
      start +
      variables +
      stack +
      breakpoints;
  }

  // Floating toolbar over the editor, as in VS Code.
  const bar = document.createElement('div');
  bar.className = 'debugbar';
  bar.setAttribute('role', 'toolbar');
  body.append(bar);

  function renderBar() {
    if (!running()) {
      bar.innerHTML = '';
      return;
    }
    const button = (action, icon, label) =>
      '<button type="button" data-debug="' +
      action +
      '" aria-label="' +
      esc(t(label)) +
      '" title="' +
      esc(t(label)) +
      '">' +
      icon +
      '</button>';
    bar.setAttribute('aria-label', t('Debug'));
    bar.innerHTML =
      '<span class="debugbar__grip" aria-hidden="true">⋮⋮</span>' +
      button('continue', '▶', 'Continue (F5)') +
      button('step', '↷', 'Step over (F10)') +
      button('restart', '⟲', 'Restart (Ctrl Shift F5)') +
      button('stop', '■', 'Stop (Shift F5)') +
      '<span class="debugbar__count">' +
      (index + 1) +
      ' / ' +
      stops.length +
      '</span>';
  }

  // A peek under the paused line, for phones where the side bar is a drawer.
  let peek = null;

  function renderPeek(stop) {
    if (peek) peek.remove();
    peek = document.createElement('div');
    peek.className = 'debug-peek';
    peek.innerHTML =
      '<p class="debug-peek__head"><span class="f">' +
      esc(stop.frame) +
      '</span> <span class="debug__where">' +
      esc(where(stop)) +
      '</span></p>' +
      variablesHtml(stop);
    stop.line.after(peek);
  }

  function markBreakpoints(on) {
    $$('.l.has-bp, .l.is-paused').forEach((line) => line.classList.remove('has-bp', 'is-paused'));
    if (on) stops.forEach((stop) => stop.line.classList.add('has-bp'));
  }

  // ---------- Running ----------

  const print = (html) => P.terminal && P.terminal.print(html);

  function pause(i) {
    index = i;
    const stop = stops[index];
    markBreakpoints(true);
    stop.line.classList.add('is-paused');
    P.openFile(stop.file);
    renderPeek(stop);
    renderPanel();
    renderBar();
    stop.line.scrollIntoView({ block: 'center' });
    print(
      '<span class="debug-log">⏸ Paused on breakpoint</span> <span class="f">' +
        esc(stop.frame) +
        '</span> <span class="c">' +
        esc(where(stop)) +
        '</span>',
    );
    P.flash(t('Paused on') + ' ' + where(stop));
  }

  function start() {
    if (P.isPlain && P.isPlain()) return;
    stops = readStops();
    if (!stops.length) return;
    root.classList.add('is-debugging');
    if (desktop.matches) {
      P.showView('debug');
      P.toggleTerminal(true);
    }
    print(
      '<span class="debug-log">Debugger attached.</span> Stepping through <span class="f">career()</span>…',
    );
    pause(0);
  }

  function finish(stopped) {
    const done = stops.slice(0, index + 1);
    index = -1;
    markBreakpoints(false);
    if (peek) peek.remove();
    peek = null;
    root.classList.remove('is-debugging');
    renderPanel();
    renderBar();
    if (stopped) {
      print('<span class="debug-log">Debugger detached.</span>');
      return;
    }
    // What career() returns: counted from the stops, nothing made up.
    const jobs = done.filter((stop) => stop.file === 'experience');
    const total = jobs.reduce((sum, stop) => sum + (stop.vars[4][1] || 0), 0);
    const stack = new Set(jobs.flatMap((stop) => stop.vars[6][1]));
    print(
      '<span class="f">career()</span> returned <span class="m">{</span> <span class="n">jobs</span>: <span class="k">' +
        jobs.length +
        '</span>, <span class="n">years</span>: <span class="k">' +
        total +
        '</span>, <span class="n">stack</span>: <span class="k">' +
        stack.size +
        '</span>, <span class="n">mentoring</span>: <span class="k">' +
        done.some((stop) => stop.file === 'mentoring') +
        '</span> <span class="m">}</span>\n<span class="c">Process exited with code 0.</span> ' +
        P.terminal.button('debug'),
    );
    P.flash(t('Debugging finished'));
  }

  function next() {
    if (!running()) return start();
    if (index + 1 < stops.length) pause(index + 1);
    else finish(false);
  }

  function restart() {
    if (running()) finish(true);
    start();
  }

  const actions = {
    start,
    continue: next,
    step: next,
    restart,
    stop: () => running() && finish(true),
  };

  document.addEventListener('click', (event) => {
    const control = event.target.closest('[data-debug]');
    if (control) {
      actions[control.dataset.debug]();
      return;
    }
    const goto = event.target.closest('[data-debug-goto]');
    if (goto) {
      const i = Number(goto.dataset.debugGoto);
      if (running()) pause(i);
      else {
        const stop = stops[i];
        P.openFile(stop.file);
        stop.line.scrollIntoView({ block: 'center' });
        stop.line.classList.add('is-current');
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'F5' && event.key !== 'F10') return;
    if (P.isPlain && P.isPlain()) return;
    event.preventDefault();
    if (event.repeat) return;
    if (event.key === 'F10') return running() && next();
    if (event.shiftKey && (event.ctrlKey || event.metaKey)) return restart();
    if (event.shiftKey) return actions.stop();
    next();
  });

  // New language: read the values again and show the same stop.
  document.addEventListener('portfolio:content', (event) => {
    if (!event.detail || !event.detail.locale) return;
    const was = index;
    stops = readStops();
    if (was !== -1 && stops[was]) pause(was);
    else renderPanel();
    renderBar();
  });

  // "▶ Debug my career" above experience.ts.
  const experience = $('#experience .file__source');
  if (experience) {
    const lens = document.createElement('p');
    lens.className = 'lens';
    lens.innerHTML =
      '<button class="lens__run" type="button" data-debug="start">▶ Debug my career</button>' +
      '<span aria-hidden="true">|</span><span>F5</span>';
    experience.prepend(lens);
  }

  if (P.terminal) {
    P.terminal.addCommand('debug', {
      about: 'step through my career: debug',
      run: () => {
        restart();
      },
    });
  }

  renderPanel();

  P.debug = { start, next, stop: actions.stop, restart, running };
})();
