// Anonymous visit statistics. The page view and a few events (CV downloads,
// the simple view, the language, files opened, outbound links, email and
// terminal commands) go to this site's own Cloudflare Worker
// (worker/guestbook.js), which passes them on to GoatCounter
// (https://nazima.goatcounter.com). GoatCounter's own address is on ad
// blockers' lists, the Worker's is not. No cookies, nothing personal is
// stored. Nothing is sent from localhost.
//
// The file is not called analytics.js on purpose: blockers block that name too.
(function () {
  'use strict';

  const P = window.Portfolio;
  if (!P) return;

  // The Worker's address, from Cloudflare (Workers > the worker > Domains).
  const ENDPOINT = 'https://portfolio-guestbook.nazima-jumaniyazova-95.workers.dev/';

  // Same switch as GoatCounter's own script, so browsers already excluded
  // with #toggle-goatcounter stay excluded.
  const SKIP_KEY = 'skipgc';

  function stored() {
    try {
      return localStorage.getItem(SKIP_KEY) === 't';
    } catch (e) {
      return false;
    }
  }

  if (location.hash === '#toggle-goatcounter') {
    try {
      if (stored()) localStorage.removeItem(SKIP_KEY);
      else localStorage.setItem(SKIP_KEY, 't');
      window.alert(
        stored()
          ? 'Visits from this browser are no longer counted.'
          : 'Visits from this browser are counted again.',
      );
    } catch (e) {
      // Storage is off: nothing to remember.
    }
  }

  const host = location.hostname;
  const off =
    !ENDPOINT ||
    !/^https?:$/.test(location.protocol) ||
    /^(localhost|127\.|0\.0\.0\.0$|\[::1\]$)/.test(host) ||
    /\.localhost$/.test(host) ||
    window.self !== window.top ||
    stored();

  // Same hints as GoatCounter's script; the server also checks the User-Agent.
  function bot() {
    const w = window;
    if (w.callPhantom || w._phantom || w.phantom) return 150;
    if (w.__nightmare) return 151;
    const d = document;
    if (d.__selenium_unwrapped || d.__webdriver_evaluate || d.__driver_evaluate) return 152;
    if (navigator.webdriver) return 153;
    return 0;
  }

  const pending = [];
  let timer = 0;

  function post(hits) {
    const body = JSON.stringify({ hits: hits });
    // text/plain keeps it a simple request: no CORS preflight.
    try {
      if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return;
    } catch (e) {
      // No sendBeacon: fall through to fetch.
    }
    fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'no-cors' }).catch(
      () => {},
    );
  }

  function flush() {
    clearTimeout(timer);
    timer = 0;
    while (pending.length) post(pending.splice(0, 20));
  }

  // Events are sent in small batches; whatever is left goes when the tab hides.
  function queue(hit, now) {
    if (off) return;
    pending.push(hit);
    if (now) flush();
    else if (!timer) timer = setTimeout(flush, 2000);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);

  // The page view. A ?ref= tag (one per job application) is the referrer.
  function pageview() {
    const canonical = document.querySelector('link[rel="canonical"]');
    const tag = new URLSearchParams(location.search).get('ref');
    queue(
      {
        path: canonical ? new URL(canonical.href).pathname : location.pathname,
        title: document.title,
        ref: tag || document.referrer,
        size: [screen.width, screen.height, window.devicePixelRatio || 1],
        language: navigator.language,
        bot: bot(),
      },
      true,
    );
  }

  if (document.visibilityState === 'prerender') {
    document.addEventListener('visibilitychange', function seen() {
      if (document.visibilityState === 'prerender') return;
      document.removeEventListener('visibilitychange', seen);
      pageview();
    });
  } else {
    pageview();
  }

  const once = new Set();
  let loaded = document.readyState === 'complete';

  function track(path, title, unique) {
    if (unique) {
      if (once.has(path)) return;
      once.add(path);
    }
    queue({ path: path, title: title || path, event: true, bot: bot() });
  }

  // Things that happen while the page starts (the README opening, Russian
  // applied for a Russian browser) are not the visitor's choice.
  window.addEventListener('load', () => {
    loaded = true;
    // A ?view=plain link or a saved choice opens the simple view right away.
    if (document.documentElement.classList.contains('plain-view')) {
      track('simple-view', 'Opened the simple view', true);
    }
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (/\.pdf($|\?)/i.test(href)) return track('cv-download', 'Downloaded the CV');
    if (/^mailto:/i.test(href)) return track('email', 'Opened an email to me');
    if (!/^https?:/i.test(href) || link.host === location.host) return;
    const site = link.hostname.replace(/^www\./, '');
    if (/linkedin\.com$/.test(site)) return track('out-linkedin', 'Went to LinkedIn');
    if (/^t\.me$/.test(site)) return track('out-telegram', 'Went to Telegram');
    if (/github\.com$/.test(site)) return track('out-github', 'Went to GitHub');
    track('out-' + site, 'Went to ' + site);
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
