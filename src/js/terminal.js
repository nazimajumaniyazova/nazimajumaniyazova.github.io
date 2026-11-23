// Interactive terminal. Commands are plain functions in COMMANDS: each gets
// the arguments and returns an HTML string to print (or nothing).
(function () {
  'use strict';

  const P = window.Portfolio;
  const out = document.getElementById('terminal-out');
  const form = document.getElementById('terminal-form');
  const input = document.getElementById('terminal-input');
  const body = document.getElementById('terminal-body');
  if (!P || !out || !form) return;

  const EMAIL = 'nazima.jumaniyazova.95@gmail.com';
  const GITHUB = 'https://github.com/nazimajumaniyazova';
  const TELEGRAM = 'https://t.me/nazima_jm';
  const LINKEDIN = 'https://www.linkedin.com/in/nazima-jumaniyazova-7708a5269/';

  const history = [];
  let historyIndex = 0;

  const esc = (text) =>
    String(text).replace(
      /[&<>"]/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char],
    );

  const run = (command) =>
    '<button type="button" data-run="' + command + '">' + command + '</button>';
  const fileLink = (file) => '<a href="#' + file.id + '">' + file.path + '</a>';
  const external = (url, label) =>
    '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';

  function print(html, className) {
    const line = document.createElement('div');
    if (className) line.className = className;
    line.innerHTML = html;
    out.append(line);
    body.scrollTop = body.scrollHeight;
  }

  function findFile(arg) {
    const query = String(arg || '')
      .replace(/^\.\//, '')
      .toLowerCase();
    if (!query) return null;
    return (
      P.files.find(
        (file) =>
          file.path.toLowerCase() === query ||
          file.name.toLowerCase() === query ||
          file.id === query ||
          file.name.toLowerCase().replace(/\.\w+$/, '') === query,
      ) || P.resolve(query)
    );
  }

  // Plain text of a file, with the indentation the editor draws in CSS.
  function fileText(file) {
    return Array.from(file.el.querySelectorAll('.file__source .l'))
      .map((line) => {
        const indent = (line.className.match(/\bi(\d)\b/) || [0, 0])[1];
        return '  '.repeat(Number(indent)) + line.textContent.replace(/\s+/g, ' ').trim();
      })
      .join('\n');
  }

  const notFound = (name) =>
    '<span class="terminal__error">No such file: ' + esc(name) + '</span>. Try ' + run('ls') + '.';

  // ---------- Running projects ----------

  const isProject = (file) => Boolean(file) && file.path.startsWith('projects/');
  const projects = P.files.filter(isProject);
  const wide = window.matchMedia('(min-width: 80em)');

  // Everything the fake build needs is read from the project file itself.
  function projectInfo(file) {
    const source = file.el.querySelector('.file__source');
    const name = source.querySelector('h2 .s');
    const link = source.querySelector('.l a[href^="http"]');
    const stack = Array.from(source.querySelectorAll('.skill'), (skill) =>
      skill.textContent.replace(/['"]/g, ''),
    );
    return {
      name: name ? name.textContent.replace(/"/g, '') : file.name,
      url: link ? link.href : null,
      stack: Array.from(new Set(stack)),
      window: file.el.querySelector('.file__preview .window'),
    };
  }

  // A "▶ Run | Open live site" lens above the code of every project.
  projects.forEach((file) => {
    const info = projectInfo(file);
    const lens = document.createElement('p');
    lens.className = 'lens';
    lens.innerHTML =
      '<button class="lens__run" type="button" data-run-project="' +
      file.id +
      '">▶ Run</button>' +
      (info.url
        ? '<span aria-hidden="true">|</span>' + external(info.url, 'Open live site')
        : '<span aria-hidden="true">|</span><span>no public link</span>');
    file.el.querySelector('.file__source').prepend(lens);
  });

  const bar = (part) => {
    const filled = Math.round(part * 24);
    return (
      '  [' +
      '█'.repeat(filled) +
      '░'.repeat(24 - filled) +
      '] ' +
      String(Math.round(part * 100)).padStart(3) +
      '%'
    );
  };

  let running = false;

  function runProject(file) {
    if (running) return 'A project is already starting, give it a second.';
    running = true;
    const info = projectInfo(file);
    const win = info.window;
    P.openFile(file.id);
    P.toggleTerminal(true);

    if (win) {
      win.classList.remove('is-running');
      win.classList.add('is-booting');
      win.style.setProperty('--progress', 0.04);
      if (!wide.matches) win.scrollIntoView({ block: 'nearest' });
    }

    // Numbers only make the log look alive; they are stable per project.
    const modules = 64 + info.name.length * 11 + info.stack.length * 23;
    const time = 320 + ((info.name.length * 97) % 480);
    const steps = [
      '<span class="c">&gt; ' + file.id + '@1.0.0 dev</span>',
      ' ',
      info.stack.length
        ? '  resolving  <span class="s">' + info.stack.map(esc).join(' · ') + '</span>'
        : '  resolving  dependencies',
      'progress',
      '  <span class="s">✓</span> ' + modules + ' modules compiled in ' + time + ' ms',
      ' ',
      '  <span class="m">➜</span>  Live:     ' +
        (info.url
          ? external(info.url, info.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))
          : '<span class="c">no public link for this project</span>'),
    ];
    if (win) {
      steps.push(
        '  <span class="m">➜</span>  Preview:  ' +
          (wide.matches ? 'on the right' : 'above the code'),
      );
    }

    const pause = P.reducedMotion ? 0 : 240;
    let index = 0;

    function finish() {
      running = false;
      if (win) {
        win.style.setProperty('--progress', 1);
        win.classList.remove('is-booting');
        win.classList.add('is-running');
      }
      P.flash(info.name + ' is running');
    }

    function progress(done) {
      const line = document.createElement('div');
      out.append(line);
      if (P.reducedMotion) {
        line.textContent = bar(1);
        return done();
      }
      let part = 0;
      const timer = setInterval(() => {
        part = Math.min(1, part + 0.06 + Math.random() * 0.07);
        line.textContent = bar(part);
        if (win) win.style.setProperty('--progress', 0.1 + part * 0.9);
        body.scrollTop = body.scrollHeight;
        if (part >= 1) {
          clearInterval(timer);
          setTimeout(done, 160);
        }
      }, 70);
    }

    (function next() {
      if (index >= steps.length) return finish();
      const step = steps[index++];
      if (step === 'progress') return progress(next);
      print(step);
      setTimeout(next, pause);
    })();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-run-project]');
    if (button) execute('run ' + button.dataset.runProject);
  });

  // `git log --graph`: work on main, certificates on a learning branch.
  function gitLog() {
    const commits = P.commits || [];
    const lastLearning = commits.reduce((last, commit, index) => (commit.lane ? index : last), -1);
    const rows = [];
    commits.forEach((commit, index) => {
      const graph =
        index > lastLearning
          ? '*  '
          : commit.lane
            ? '| <span class="k">*</span>'
            : '* <span class="k">|</span>';
      const head =
        commit.hash === 'c08d3f2'
          ? ' <span class="c">(HEAD -&gt; main)</span>'
          : index === 0
            ? ' <span class="c">(learning)</span>'
            : '';
      rows.push(
        graph +
          ' <button type="button" data-run="git show ' +
          commit.hash +
          '" class="h">' +
          commit.hash +
          '</button>' +
          head +
          ' ' +
          commit.date.padEnd(9) +
          esc(commit.message),
      );
      if (index === lastLearning) rows.push('|<span class="k">/</span>');
    });
    return rows.join('\n') + '\n<span class="c">Click a hash to see what it added.</span>';
  }

  const COMMANDS = {
    help: {
      about: 'show this list',
      run: () =>
        Object.keys(COMMANDS)
          .filter((name) => COMMANDS[name].about)
          .map(
            (name) =>
              run(name) +
              ' '.repeat(Math.max(1, 10 - name.length)) +
              '<span class="c">' +
              COMMANDS[name].about +
              '</span>',
          )
          .join('\n') + '\n\n<span class="c">Tab completes, ↑ and ↓ walk the history.</span>',
    },
    ls: {
      about: 'list files',
      run: (args) => {
        const dir = (args[0] || '').replace(/\/$/, '');
        const list = P.files.filter((file) => !dir || file.path.startsWith(dir + '/'));
        if (!list.length) return notFound(args[0]);
        return list.map(fileLink).join('\n') + (dir ? '' : '\nCV.pdf');
      },
    },
    open: {
      about: 'open a file in the editor: open about.md',
      run: (args) => {
        const file = findFile(args[0]);
        if (!file) return args[0] ? notFound(args[0]) : 'Usage: open &lt;file&gt;';
        P.openFile(file.id);
        return 'Opened ' + fileLink(file);
      },
    },
    cat: {
      about: 'print a file here: cat skills.json',
      run: (args) => {
        const file = findFile(args[0]);
        if (!file) return args[0] ? notFound(args[0]) : 'Usage: cat &lt;file&gt;';
        return esc(fileText(file));
      },
    },
    run: {
      about: 'start a project: run dachatop',
      run: (args) => {
        const file = args[0] ? findFile(args[0]) : P.getActive();
        if (isProject(file)) return runProject(file);
        return (
          (args[0]
            ? '<span class="terminal__error">No such project: ' + esc(args[0]) + '</span>\n'
            : '') +
          'Projects: ' +
          projects.map((project) => run('run ' + project.id)).join('  ')
        );
      },
    },
    grep: {
      about: 'search all files: grep jest',
      run: (args) => {
        const query = args.join(' ');
        if (!query) return 'Usage: grep &lt;text&gt;';
        const result = P.search(query);
        if (!result.total) return 'No matches for ' + esc(query) + '.';
        const rows = result.groups
          .flatMap((group) => group.hits)
          .slice(0, 8)
          .map((hit) => {
            const start = Math.max(0, hit.index - 20);
            return (
              '<button type="button" data-goto="' +
              hit.line.file.id +
              ':' +
              hit.line.n +
              '">' +
              hit.line.file.path +
              ':' +
              hit.line.n +
              '</button>  <span class="c">' +
              (start ? '…' : '') +
              esc(hit.line.text.slice(start, start + 64)) +
              '</span>'
            );
          });
        return (
          rows.join('\n') +
          '\n' +
          result.total +
          ' matches in ' +
          result.groups.length +
          ' files. <button type="button" data-search="' +
          esc(query) +
          '">Show all in Search</button>'
        );
      },
    },
    // The greeting is the first thing a visitor reads, so it follows the
    // language of the page (src/js/i18n.js); other output stays in English.
    whoami: {
      about: 'who is behind this site',
      run: () => {
        const t = P.t || ((text) => text);
        return [
          'Nazima Jumaniyazova, frontend software engineer from Tashkent.',
          '5 years with React and TypeScript, 2 of them in banking.',
          'Open to relocation and business trips.',
          'Type {help} to see what this terminal can do.',
        ]
          .map((line) => esc(t(line)))
          .join('\n')
          .replace('{help}', run('help'));
      },
    },
    skills: {
      about: 'open and highlight my skills',
      run: () => {
        P.openFile('skills');
        P.lightSkills();
        return 'Opened ' + fileLink(findFile('skills'));
      },
    },
    projects: {
      about: 'list my projects',
      run: () =>
        P.files
          .filter((file) => file.path.startsWith('projects/'))
          .map((file) => fileLink(file))
          .join('\n') +
        '\n' +
        external(GITHUB, 'more on GitHub'),
    },
    contact: {
      about: 'how to reach me',
      run: () =>
        'email     <a href="mailto:' +
        EMAIL +
        '">' +
        EMAIL +
        '</a>\n' +
        'linkedin  ' +
        external(LINKEDIN, 'in/nazima-jumaniyazova') +
        '\n' +
        'telegram  ' +
        external(TELEGRAM, '@nazima_jm') +
        '\n' +
        'github    ' +
        external(GITHUB, 'nazimajumaniyazova'),
    },
    cv: {
      about: 'download my CV',
      run: () => {
        document.querySelector('.titlebar__cv').click();
        return 'Downloading CV_Nazima_Jumaniyazova_EN.pdf';
      },
    },
    theme: {
      about: 'change colors: theme paper',
      run: (args) => {
        const names = P.themes.map((theme) => theme.id);
        if (!args[0]) return 'Themes: ' + names.map((name) => run('theme ' + name)).join('  ');
        return P.setTheme(args[0].toLowerCase())
          ? 'Theme set to ' + esc(args[0].toLowerCase())
          : '<span class="terminal__error">Unknown theme.</span> Try: ' + names.join(', ');
      },
    },
    git: {
      about: 'my path so far: git log',
      run: (args, raw) => {
        const sub = args[0];
        if (sub === 'log') return gitLog();
        if (sub === 'show') {
          return args[1] && P.showCommit && P.showCommit(args[1])
            ? 'Showing ' + esc(args[1]) + ' in the editor'
            : 'Usage: git show &lt;hash&gt;, hashes are in ' + run('git log');
        }
        if (sub === 'branch') return '* <span class="s">main</span>\n  learning';
        if (sub === 'status') {
          return P.git && P.git.staged()
            ? "On branch main\nYour branch is ahead of 'origin/main' by 1 commit.\n  (use " +
                run('git push') +
                ' to send your message)'
            : 'On branch main\nnothing to commit, working tree clean';
        }
        if (sub === 'commit') {
          const match = raw.match(/-m\s+(["'])([\s\S]*?)\1?\s*$/) || raw.match(/-m\s+(.+)$/);
          const message = match ? (match[2] !== undefined ? match[2] : match[1]).trim() : '';
          if (!message) return 'Usage: git commit -m "Hi Nazima!"\nYour message goes to my inbox.';
          return P.git.commit(message).join('\n') + '\nNow ' + run('git push') + ' to send it.';
        }
        if (sub === 'push') {
          const lines = P.git && P.git.push();
          return lines
            ? lines.join('\n')
            : 'Everything up-to-date. Write a message first: git commit -m "Hi Nazima!"';
        }
        return (
          'Try ' +
          ['git log', 'git status', 'git branch'].map(run).join('  ') +
          '\nor leave me a message: git commit -m "Hi Nazima!", then git push'
        );
      },
    },
    split: {
      about: 'open a file on the side: split skills.json',
      run: (args) => {
        const file = args[0] ? findFile(args[0]) : P.getActive();
        if (!file) return args[0] ? notFound(args[0]) : 'Usage: split &lt;file&gt;';
        return P.openSide(file.id) ? 'Opened ' + fileLink(file) + ' on the side' : '';
      },
    },
    clear: {
      about: 'clear the terminal',
      run: () => {
        out.textContent = '';
      },
    },
    // Not listed in help.
    github: { run: () => (window.open(GITHUB, '_blank', 'noopener'), 'Opening GitHub') },
    linkedin: { run: () => (window.open(LINKEDIN, '_blank', 'noopener'), 'Opening LinkedIn') },
    telegram: { run: () => (window.open(TELEGRAM, '_blank', 'noopener'), 'Opening Telegram') },
    email: { run: () => ((location.href = 'mailto:' + EMAIL), 'Opening your mail app') },
    date: { run: () => esc(new Date().toString()) },
    pwd: { run: () => '/home/nazima/portfolio' },
    echo: { run: (args) => esc(args.join(' ')) },
    history: { run: () => esc(history.map((line, index) => index + 1 + '  ' + line).join('\n')) },
    cd: { run: () => 'Folders are just for show. Use ' + run('ls') + ' and open &lt;file&gt;.' },
    sudo: { run: () => 'Nice try. You are a guest here.' },
    exit: { run: () => 'There is nothing outside. Try ' + run('help') + '.' },
    hello: { run: () => 'Hello! Nice to meet you. ' + run('contact') + ' if you want to talk.' },
    npm: {
      run: (args) => {
        const script = args.join(' ');
        if (/^(run )?(dev|start)$/.test(script)) return COMMANDS.run.run([]);
        if (/^(run )?test$|^t$/.test(script) && COMMANDS.test) return COMMANDS.test.run([]);
        return (
          'Try ' + run('npm test') + ', or ' + run('npm run dev') + ' while a project file is open.'
        );
      },
    },
  };
  COMMANDS.hi = COMMANDS.hello;
  COMMANDS.code = { run: COMMANDS.open.run }; // an alias, so not listed in help

  function execute(raw) {
    const line = raw.trim();
    print('<span class="m">$</span> <span class="terminal__cmd">' + esc(line) + '</span>');
    if (!line) return;
    history.push(line);
    historyIndex = history.length;

    const args = line.split(/\s+/);
    const name = args.shift().toLowerCase();
    const command = COMMANDS[name];
    if (!command) {
      print(
        '<span class="terminal__error">Command not found: ' +
          esc(name) +
          '</span>. Type ' +
          run('help') +
          '.',
      );
      return;
    }
    const result = command.run(args, line);
    if (result) print(result);
  }

  function complete() {
    const value = input.value;
    const parts = value.split(/\s+/);
    const last = parts[parts.length - 1].toLowerCase();
    let pool;
    if (parts.length === 1) pool = Object.keys(COMMANDS).filter((name) => COMMANDS[name].about);
    else if (parts[0] === 'theme') pool = P.themes.map((theme) => theme.id);
    else if (parts[0] === 'git') pool = ['log', 'status', 'branch', 'commit', 'push', 'show'];
    else if (parts[0] === 'run') pool = projects.map((file) => file.id);
    else pool = P.files.map((file) => file.path).concat(P.files.map((file) => file.name));

    const matches = Array.from(new Set(pool.filter((item) => item.toLowerCase().startsWith(last))));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = parts.join(' ') + (parts.length === 1 ? ' ' : '');
    } else if (matches.length > 1) {
      print(esc(matches.join('   ')), 'c');
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = '';
    execute(value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && input.value) {
      event.preventDefault();
      complete();
    } else if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex];
    } else if (event.key === 'ArrowDown' && history.length) {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || '';
    } else if (event.key.toLowerCase() === 'l' && event.ctrlKey) {
      event.preventDefault();
      out.textContent = '';
    }
  });

  // Clicking anywhere in the terminal focuses the prompt, unless the visitor
  // is selecting text or pressing a link.
  body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-run]');
    if (button) {
      execute(button.dataset.run);
      return;
    }
    if (event.target.closest('a, button, .snake')) return;
    if (String(window.getSelection())) return;
    input.focus();
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-term="clear"]')) out.textContent = '';
  });

  // Greeting: the terminal types "whoami" by itself once, unless the visitor
  // got there first.
  let touched = false;
  input.addEventListener('focus', () => (touched = true), { once: true });

  function greet() {
    const text = 'whoami';
    if (P.reducedMotion || touched) {
      execute(text);
      return;
    }
    let index = 0;
    (function type() {
      if (touched) {
        input.value = '';
        execute(text);
        return;
      }
      input.value = text.slice(0, ++index);
      if (index < text.length) setTimeout(type, 110);
      else
        setTimeout(() => {
          if (input.value === text) input.value = '';
          execute(text);
        }, 350);
    })();
  }

  setTimeout(greet, 900);

  P.runCommand = execute;
  P.runProject = (id) => execute('run ' + id);

  // games.js and other add-ons register commands and print through this.
  P.terminal = {
    print,
    esc,
    out,
    body,
    input,
    button: run,
    addCommand: (name, command) => (COMMANDS[name] = command),
  };
})();
