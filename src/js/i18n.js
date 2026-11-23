// Language switch: English (the text in index.html) or Russian
// (src/js/locales/ru.js). The smallest element whose whole text is a key in
// the dictionary gets the translated markup; aria-label, title, placeholder
// and alt are translated the same way. Switching back restores the original
// markup. Scripts that build text later use Portfolio.t() and
// Portfolio.translate(), and listen to "portfolio:content" to refresh.
(function () {
  'use strict';

  const P = window.Portfolio;
  const root = document.documentElement;
  if (!P) return;

  const KEY = 'locale';
  const LOCALES = { en: 'English', ru: 'Русский' };
  const ATTRS = ['aria-label', 'title', 'placeholder', 'alt'];
  // Output, user input and lists that are rebuilt by their own scripts.
  const SKIP =
    'script, style, svg, textarea, [translate="no"], #plain, .terminal__out, ' +
    '.palette__list > *, #search-results, .scm__list, .hover-card';

  const norm = (text) => text.replace(/\s+/g, ' ').trim();
  const dict = () => (P.locales && P.locales[locale]) || null;
  const units = new Map(); // element -> { html, key }
  const attrs = new Map(); // element -> { name: english value }

  let locale = root.lang === 'ru' ? 'ru' : 'en';

  // Plain text of a translation, for code that sets textContent.
  function t(text) {
    const words = dict();
    const value = words ? words[text] : undefined;
    if (value === undefined) return text;
    const box = document.createElement('div');
    box.innerHTML = value;
    return box.textContent;
  }

  // <h2><span class="h">## Title</span></h2>: translate the span, not the
  // heading, so the syntax colors and icons around the text survive.
  function narrow(el, key) {
    for (;;) {
      const ownText = Array.from(el.childNodes).some(
        (node) => node.nodeType === 3 && node.nodeValue.trim(),
      );
      const withText = Array.from(el.children).filter((child) => norm(child.textContent));
      if (ownText || withText.length !== 1 || norm(withText[0].textContent) !== key) return el;
      el = withText[0];
    }
  }

  // Attributes are looked up on their own, so a placeholder or a label inside
  // an element whose text is translated is found too.
  const ATTR_SKIP = SKIP.replace('textarea, ', '');
  const ATTR_SELECTOR = ATTRS.map((name) => '[' + name + ']').join(', ');

  function collectAttrs(scope, words) {
    [scope].concat(Array.from(scope.querySelectorAll(ATTR_SELECTOR))).forEach((el) => {
      if (!el.matches(ATTR_SELECTOR) || el.closest(ATTR_SKIP)) return;
      ATTRS.forEach((name) => {
        const value = el.getAttribute(name);
        if (!value || words[norm(value)] === undefined) return;
        const saved = attrs.get(el) || {};
        if (!(name in saved)) saved[name] = value;
        attrs.set(el, saved);
      });
    });
  }

  // Finds the elements that can be translated, without touching them.
  function collect(el, words) {
    if (el.matches(SKIP) || units.has(el)) return;
    const key = norm(el.textContent);
    if (key && words[key] !== undefined) {
      const target = narrow(el, key);
      if (!units.has(target)) units.set(target, { html: target.innerHTML, key });
      return;
    }
    Array.from(el.children).forEach((child) => collect(child, words));
  }

  function apply(scope) {
    const words = P.locales && P.locales.ru;
    if (words) {
      collect(scope || document.body, words);
      collectAttrs(scope || document.body, words);
    }
    const ru = locale === 'ru' && words;
    units.forEach((unit, el) => {
      if (scope && !scope.contains(el)) return;
      if (!el.isConnected) return units.delete(el);
      el.innerHTML = ru ? words[unit.key] : unit.html;
    });
    attrs.forEach((saved, el) => {
      if (scope && !scope.contains(el)) return;
      if (!el.isConnected) return attrs.delete(el);
      Object.keys(saved).forEach((name) =>
        el.setAttribute(name, ru ? t(norm(saved[name])) : saved[name]),
      );
    });
  }

  const englishTitle = document.title;

  function setLocale(id, options) {
    if (!LOCALES[id]) return false;
    const changed = id !== locale;
    locale = id;
    root.lang = id;
    document.title = id === 'ru' ? t(englishTitle) : englishTitle;
    apply();
    root.classList.remove('i18n-pending');
    const status = document.getElementById('status-locale');
    if (status) status.textContent = id.toUpperCase();
    if (!options || options.save !== false) {
      try {
        localStorage.setItem(KEY, id);
      } catch (e) {
        // Private mode: the language resets on the next visit.
      }
    }
    if (changed || (options && options.force)) {
      document.dispatchEvent(new CustomEvent('portfolio:content', { detail: { locale: id } }));
    }
    if (changed && options && options.announce)
      P.flash(id === 'ru' ? 'Язык: русский' : 'Language: English');
    return true;
  }

  const toggleLocale = () => setLocale(locale === 'ru' ? 'en' : 'ru', { announce: true });

  if (P.terminal) {
    P.terminal.addCommand('lang', {
      about: 'switch the language: lang ru',
      run: (args) => {
        const id = (args[0] || '').toLowerCase();
        if (!id)
          return (
            'Language: ' +
            locale +
            '. Try ' +
            P.terminal.button('lang ru') +
            '  ' +
            P.terminal.button('lang en')
          );
        return setLocale(id, { announce: true })
          ? 'Language set to ' + LOCALES[id]
          : '<span class="terminal__error">Unknown language.</span> Try: en, ru';
      },
    });
  }

  P.t = t;
  P.translate = (scope) => apply(scope);
  P.getLocale = () => locale;
  P.setLocale = (id) => setLocale(id, { announce: true });
  P.toggleLocale = toggleLocale;
  P.localeNames = LOCALES;

  // The inline script in <head> picked the language before the first paint.
  if (locale === 'ru') setLocale('ru', { save: false, force: true });
  else {
    const status = document.getElementById('status-locale');
    if (status) status.textContent = 'EN';
  }
})();
