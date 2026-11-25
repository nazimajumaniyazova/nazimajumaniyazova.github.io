// "git commit" form in contact.ts. Push opens the visitor's mail app with the
// message filled in; nothing is sent from this page. The terminal reuses it
// for `git commit -m "..."` and `git push`.
(function () {
  'use strict';

  const P = window.Portfolio;
  if (!P) return;

  const EMAIL = 'nazima.jumaniyazova.95@gmail.com';
  const esc = (text) =>
    String(text).replace(
      /[&<>"]/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char],
    );

  // A stable 7-character "commit hash" for a message.
  function hash(text) {
    let value = 2166136261;
    for (const char of text) {
      value ^= char.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return (value >>> 0).toString(16).padStart(8, '0').slice(0, 7);
  }

  const firstLine = (message) => {
    const line = message.trim().split('\n')[0];
    return line.length > 60 ? line.slice(0, 57) + '…' : line;
  };

  function commit(message) {
    const lines = message.trim().split('\n').length;
    return [
      '[main ' + hash(message) + '] ' + esc(firstLine(message)),
      ' 1 file changed, ' + lines + ' insertion' + (lines === 1 ? '' : 's') + '(+)',
    ];
  }

  // Opens the mail app and returns the log lines to print.
  function push(message) {
    const subject = 'Portfolio: ' + firstLine(message);
    document.dispatchEvent(new CustomEvent('portfolio:contact'));
    location.href =
      'mailto:' +
      EMAIL +
      '?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(message.trim());
    return [
      'Enumerating objects: 3, done.',
      'Writing objects: 100% (3/3), done.',
      'To mailto:' + EMAIL,
      '   c08d3f2..' + hash(message) + '  main -&gt; inbox',
      '<span class="s">✓</span> Your mail app should open with this message.',
      '  No mail app? <button type="button" data-copy="' +
        EMAIL +
        '">Copy my email</button> and write from anywhere.',
    ];
  }

  // ---------- The form ----------

  function printTo(log, lines) {
    log.textContent = '';
    lines.forEach((line, index) => {
      setTimeout(
        () => {
          const row = document.createElement('div');
          row.innerHTML = line;
          log.append(row);
          row.scrollIntoView({ block: 'nearest' });
        },
        P.reducedMotion ? 0 : index * 140,
      );
    });
  }

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('.commit');
    if (!form) return;
    event.preventDefault();
    const field = form.querySelector('.commit__input');
    const log = form.querySelector('.commit__log');
    const message = field.value;
    if (!message.trim()) {
      printTo(log, [
        '<span class="terminal__error">Aborting commit due to empty commit message.</span>',
      ]);
      field.focus();
      return;
    }
    printTo(log, commit(message).concat(push(message)));
    P.flash('Pushed to inbox');
  });

  document.addEventListener('keydown', (event) => {
    const field = event.target.closest && event.target.closest('.commit__input');
    if (field && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      field.form.requestSubmit();
    }
  });

  // ---------- For the terminal ----------

  let staged = null;

  P.git = {
    commit(message) {
      staged = message;
      return commit(message);
    },
    push() {
      if (!staged) return null;
      const lines = push(staged);
      staged = null;
      return lines;
    },
    staged: () => staged,
  };
})();
