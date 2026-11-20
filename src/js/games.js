// Two terminal extras: `npm test` (a Jest-style run whose tests are facts
// from this site) and `snake` (collect my skills, arrows or swipes).
(function () {
  'use strict';

  const P = window.Portfolio;
  const T = P && P.terminal;
  if (!T) return;

  const pause = (ms) => (P.reducedMotion ? 0 : ms);

  // ---------- npm test ----------

  // Every test is a fact stated elsewhere on the site (experience.ts,
  // mentoring.md, certificates.json, languages.yml, contact.ts).
  const SUITES = [
    [
      'experience',
      [
        'has 5 years with React and TypeScript',
        'spent 2 years on banking products at Asakabank',
        'builds product features at PLATMA since Sep 2025',
      ],
    ],
    [
      'impact',
      [
        'improved UX and performance of an analytics system by 40%',
        'cut dashboard load time by 30% with WebSocket and code splitting',
        'made new interfaces 25% faster to deliver with a shared component library',
      ],
    ],
    [
      'quality',
      [
        'covers components with Jest and React Testing Library',
        'reviews code and keeps technical documentation up to date',
      ],
    ],
    [
      'community',
      [
        'mentors at The Rolling Scopes School since Dec 2025',
        'completed the RS School JavaScript / Front-end course in 2023',
      ],
    ],
    [
      'teamwork',
      ['speaks Russian, Uzbek and English (B2)', 'is open to relocation and business trips'],
    ],
  ];

  let testing = false;

  function runTests() {
    if (testing) return 'Tests are already running.';
    testing = true;
    const lines = [
      '<span class="c">&gt; nazima@5.0.0 test</span>',
      '<span class="c">&gt; jest</span>',
      ' ',
      '<span class="test-badge">PASS</span> src/nazima.test.ts',
    ];
    let total = 0;
    let time = 0;
    SUITES.forEach(([suite, tests]) => {
      lines.push('  ' + suite);
      tests.forEach((test) => {
        const ms = 2 + ((test.length * 7) % 19);
        time += ms;
        total += 1;
        lines.push(
          '    <span class="s">✓</span> ' + T.esc(test) + ' <span class="c">(' + ms + ' ms)</span>',
        );
      });
    });
    lines.push(
      ' ',
      'Test Suites: <span class="s">1 passed</span>, 1 total',
      'Tests:       <span class="s">' + total + ' passed</span>, ' + total + ' total',
      'Time:        ' + (0.9 + time / 1000).toFixed(2) + ' s',
      '<span class="c">Ran all test suites.</span> Want to talk? ' + T.button('contact'),
    );

    let index = 0;
    (function next() {
      if (index >= lines.length) {
        testing = false;
        P.flash(total + ' tests passed');
        return;
      }
      T.print(lines[index++]);
      setTimeout(next, pause(index < 5 ? 220 : 90));
    })();
  }

  T.addCommand('test', { about: 'run the tests: npm test', run: runTests });

  // ---------- snake ----------

  const ROWS = 9;
  const DIRS = {
    arrowup: [0, -1],
    w: [0, -1],
    arrowdown: [0, 1],
    s: [0, 1],
    arrowleft: [-1, 0],
    a: [-1, 0],
    arrowright: [1, 0],
    d: [1, 0],
  };

  const skills = Array.from(
    new Set(
      Array.from(document.querySelectorAll('#skills .skill'), (el) =>
        el.textContent.replace(/['"]/g, '').replace(/\s*\(.*?\)/, ''),
      ),
    ),
  );

  let game = null;
  const touchScreen = () => !window.matchMedia('(pointer: fine)').matches;
  const hint = (paused) =>
    touchScreen()
      ? paused
        ? 'paused, tap to go on'
        : 'swipe to turn, tap to pause, clear to stop'
      : paused
        ? 'paused, Space to go on'
        : 'arrows to turn, Space pause, Esc stop';

  // How many characters fit on one terminal line.
  function lineWidth() {
    const probe = document.createElement('span');
    probe.textContent = '0000000000';
    probe.style.visibility = 'hidden';
    T.out.append(probe);
    const width = probe.getBoundingClientRect().width / 10;
    probe.remove();
    return Math.floor(T.out.clientWidth / (width || 8));
  }

  function startSnake() {
    if (game) return 'Snake is already running. Press Esc to stop it.';
    if (!skills.length) return 'No skills to collect.';
    P.toggleTerminal(true);

    const cols = Math.max(10, Math.min(24, Math.floor((lineWidth() - 2) / 2)));
    const board = document.createElement('pre');
    board.className = 'snake';
    board.setAttribute('aria-label', 'Snake game. Use the arrow keys, Escape to stop.');
    const status = document.createElement('div');
    status.className = 'snake__status';
    T.out.append(board, status);

    game = {
      cols,
      board,
      status,
      body: [
        [3, 4],
        [2, 4],
        [1, 4],
      ],
      dir: [1, 0],
      next: [1, 0],
      food: null,
      eaten: [],
      speed: 150,
      paused: false,
      timer: null,
    };
    placeFood();
    draw();
    // Arrow keys reach the game from the terminal prompt; on touch screens the
    // keyboard would cover the board, so the prompt lets go of the focus.
    if (window.matchMedia('(pointer: fine)').matches) T.input.focus();
    else T.input.blur();
    game.timer = setTimeout(tick, 400);
    return '';
  }

  function placeFood() {
    const free = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < game.cols; x += 1) {
        if (!game.body.some(([bx, by]) => bx === x && by === y)) free.push([x, y]);
      }
    }
    game.food = free[Math.floor(Math.random() * free.length)];
  }

  const nextSkill = () => skills[game.eaten.length % skills.length];

  function draw() {
    const { cols, body, food } = game;
    const label = nextSkill().slice(0, 2).padEnd(2);
    // Cells are two spaces with a background: box-drawing and block glyphs
    // are not in the web font and would break the alignment.
    const rows = [];
    for (let y = 0; y < ROWS; y += 1) {
      let row = '';
      for (let x = 0; x < cols; x += 1) {
        const part = body.findIndex(([bx, by]) => bx === x && by === y);
        if (part === 0) row += '<i class="snake__head">  </i>';
        else if (part > 0) row += '<i class="snake__body">  </i>';
        else if (food[0] === x && food[1] === y)
          row += '<i class="snake__food">' + T.esc(label) + '</i>';
        else row += '  ';
      }
      rows.push(row);
    }
    game.board.innerHTML = rows.join('\n');
    game.status.innerHTML =
      'score <span class="h">' +
      game.eaten.length +
      '</span>  next: <span class="s">' +
      T.esc(nextSkill()) +
      '</span>  <span class="c">' +
      hint(game.paused) +
      '</span>';
  }

  function tick() {
    if (!game) return;
    if (!game.board.isConnected) return stopSnake(true);
    if (game.paused || document.hidden) {
      game.timer = setTimeout(tick, game.speed);
      return;
    }
    game.dir = game.next;
    const head = game.body[0];
    const moved = [head[0] + game.dir[0], head[1] + game.dir[1]];
    const hitWall = moved[0] < 0 || moved[1] < 0 || moved[0] >= game.cols || moved[1] >= ROWS;
    const hitSelf = game.body.slice(0, -1).some(([x, y]) => x === moved[0] && y === moved[1]);
    if (hitWall || hitSelf) return stopSnake();

    game.body.unshift(moved);
    if (moved[0] === game.food[0] && moved[1] === game.food[1]) {
      game.eaten.push(nextSkill());
      game.speed = Math.max(80, game.speed - 5);
      placeFood();
    } else {
      game.body.pop();
    }
    draw();
    T.body.scrollTop = T.body.scrollHeight;
    game.timer = setTimeout(tick, game.speed);
  }

  function stopSnake(silent) {
    if (!game) return;
    clearTimeout(game.timer);
    const { eaten } = game;
    game.status.remove();
    game = null;
    if (silent) return;
    T.print(
      'Game over. Score <span class="h">' +
        eaten.length +
        '</span>.' +
        (eaten.length
          ? ' Collected: <span class="s">' + T.esc(eaten.join(', ')) + '</span>.'
          : '') +
        ' ' +
        T.button('snake') +
        ' to play again.',
    );
    P.flash('Snake score: ' + eaten.length);
  }

  function turn(dir) {
    // No turning back into yourself.
    if (dir[0] === -game.dir[0] && dir[1] === -game.dir[1]) return;
    game.next = dir;
  }

  // Keys go to the game while it runs and the focus is not in another field.
  document.addEventListener(
    'keydown',
    (event) => {
      if (!game || event.ctrlKey || event.metaKey || event.altKey) return;
      const focus = document.activeElement;
      if (focus && focus !== document.body && focus !== T.input && !focus.closest('#terminal'))
        return;
      const key = event.key.toLowerCase();
      if (DIRS[key]) turn(DIRS[key]);
      else if (key === ' ') {
        game.paused = !game.paused;
        draw();
      } else if (key === 'escape' || key === 'q') stopSnake();
      else return;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );

  let touch = null;
  T.out.addEventListener(
    'touchstart',
    (event) => {
      if (game && event.target.closest('.snake')) touch = event.touches[0];
    },
    { passive: true },
  );
  T.out.addEventListener('touchend', (event) => {
    if (!game || !touch) return;
    const end = event.changedTouches[0];
    const dx = end.clientX - touch.clientX;
    const dy = end.clientY - touch.clientY;
    touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
      game.paused = !game.paused;
      draw();
      return;
    }
    turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
  });

  T.addCommand('snake', { about: 'play a game: collect my skills', run: startSnake });
})();
