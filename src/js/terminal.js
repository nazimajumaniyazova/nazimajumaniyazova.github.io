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
    whoami: {
      about: 'who is behind this site',
      run: () =>
        'Nazima Jumaniyazova, frontend software engineer from Tashkent.\n' +
        '4+ years with React, TypeScript, Redux Toolkit and Tailwind CSS.\n' +
        'Type ' +
        run('help') +
        ' to see what this terminal can do.',
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
      run: (args) =>
        args[0] === 'log'
          ? [
              '<span class="h">c08d3f2</span> <span class="c">(HEAD -&gt; main)</span> Dec 2025  Frontend Mentor, The Rolling Scopes School',
              '<span class="h">e41b7a9</span> Sep 2025  Frontend Software Engineer, PLATMA',
              '<span class="h">a3f9c21</span> Sep 2023  Frontend Software Engineer, Asakabank',
              '<span class="h">9d2e6b4</span> May 2021  Frontend Software Engineer, Brain Development',
              '<span class="h">7be4d10</span> Oct 2019  Customer Support &amp; Front-End Assistant, StylemixThemes',
              '<span class="h">2c1a9f4</span> 2017      Mathematics teacher',
              '<span class="h">0000001</span> 2013      init: Applied Mathematics and Computer Science, MSU',
            ].join('\n')
          : 'Only ' + run('git log') + ' works here.',
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
  };
  COMMANDS.hi = COMMANDS.hello;
  COMMANDS.code = COMMANDS.open;

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
    const result = command.run(args);
    if (result) print(result);
  }

  function complete() {
    const value = input.value;
    const parts = value.split(/\s+/);
    const last = parts[parts.length - 1].toLowerCase();
    let pool;
    if (parts.length === 1) pool = Object.keys(COMMANDS).filter((name) => COMMANDS[name].about);
    else if (parts[0] === 'theme') pool = P.themes.map((theme) => theme.id);
    else if (parts[0] === 'git') pool = ['log'];
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
    if (event.target.closest('a, button')) return;
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
})();
