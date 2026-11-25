// Anonymous visit statistics with GoatCounter (https://nazima.goatcounter.com),
// which sets no cookies and stores no personal data. GoatCounter's own script
// in index.html counts the page view and reads a ?ref= tag as the referrer;
// this file adds events for the actions that matter: CV downloads, the simple
// view, the language, files opened, outbound links, email and terminal
// commands. Nothing is sent from localhost.
(function () {
  'use strict';

  const P = window.Portfolio;
  if (!P) return;

  const queue = [];
  const once = new Set();
  let loaded = document.readyState === 'complete';

  function send(path, title) {
    const gc = window.goatcounter;
    if (!gc || typeof gc.count !== 'function') return false;
    gc.count({ path: path, title: title, event: true });
    return true;
  }

  // count.js loads async (and may be blocked), so events wait in a queue.
  function flush() {
    while (queue.length && send(queue[0][0], queue[0][1])) queue.shift();
  }

  function track(path, title, unique) {
    if (unique) {
      if (once.has(path)) return;
      once.add(path);
    }
    queue.push([path, title || path]);
    flush();
  }

  let tries = 0;
  const retry = setInterval(() => {
    flush();
    if (!queue.length || ++tries > 20) clearInterval(retry);
  }, 1000);

  // Things that happen while the page starts (the README opening, Russian
  // applied for a Russian browser) are not the visitor's choice.
  window.addEventListener('load', () => {
    loaded = true;
    // A ?view=plain link or a saved choice opens the simple view right away.
    if (document.documentElement.classList.contains('plain-view')) {
      track('simple-view', 'Opened the simple view', true);
    }
    flush();
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (/\.pdf($|\?)/i.test(href)) return track('cv-download', 'Downloaded the CV');
    if (/^mailto:/i.test(href)) return track('email', 'Opened an email to me');
    if (!/^https?:/i.test(href) || link.host === location.host) return;
    const host = link.hostname.replace(/^www\./, '');
    if (/linkedin\.com$/.test(host)) return track('out-linkedin', 'Went to LinkedIn');
    if (/^t\.me$/.test(host)) return track('out-telegram', 'Went to Telegram');
    if (/github\.com$/.test(host)) return track('out-github', 'Went to GitHub');
    track('out-' + host, 'Went to ' + host);
  });

  document.addEventListener('portfolio:open', (event) => {
    if (loaded && event.detail) track('open-' + event.detail, 'Opened ' + event.detail, true);
  });

  document.addEventListener('portfolio:plain', (event) => {
    if (event.detail) track('simple-view', 'Opened the simple view', true);
  });

  document.addEventListener('portfolio:content', (event) => {
    const locale = event.detail && event.detail.locale;
    if (loaded && locale) track('lang-' + locale, 'Switched the language to ' + locale, true);
  });

  document.addEventListener('portfolio:command', (event) => {
    // The greeting runs whoami on start; only commands after load are the visitor's.
    if (loaded && event.detail)
      track('cmd-' + event.detail, 'Ran ' + event.detail + ' in the terminal', true);
  });

  document.addEventListener('portfolio:contact', () =>
    track('contact-form', 'Sent a message with git commit'),
  );

  P.track = track;
})();
