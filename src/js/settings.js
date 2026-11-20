// .vscode/settings.json: every value in that file is a control. Changes apply
// at once and are kept in localStorage. The inline script in <head> applies
// the saved values before the first paint, so keep the two in sync.
(function () {
  'use strict';

  const P = window.Portfolio;
  const root = document.documentElement;
  if (!P || !document.getElementById('settings')) return;

  const KEY = 'settings';
  const FONT_MIN = 11;
  const FONT_MAX = 22;
  const DEFAULTS = {
    fontSize: null,
    wordWrap: 'on',
    lineNumbers: 'on',
    minimap: true,
    animations: true,
  };
  const NAMES = {
    theme: 'workbench.colorTheme',
    fontSize: 'editor.fontSize',
    wordWrap: 'editor.wordWrap',
    lineNumbers: 'editor.lineNumbers',
    minimap: 'editor.minimap.enabled',
    animations: 'workbench.animations',
  };
  const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  const state = Object.assign({}, DEFAULTS, load());

  // The default font size is fluid (a clamp() in _tokens.scss), so measure it.
  const savedFont = root.style.getPropertyValue('--fs-code');
  root.style.removeProperty('--fs-code');
  const defaultFont = Math.round(parseFloat(getComputedStyle(document.body).fontSize)) || 15;
  if (savedFont) root.style.setProperty('--fs-code', savedFont);

  function save() {
    const changed = {};
    Object.keys(DEFAULTS).forEach((key) => {
      if (state[key] !== DEFAULTS[key]) changed[key] = state[key];
    });
    try {
      if (Object.keys(changed).length) localStorage.setItem(KEY, JSON.stringify(changed));
      else localStorage.removeItem(KEY);
    } catch (e) {
      // Private mode: settings last until the page is closed.
    }
  }

  function valueText(name) {
    if (name === 'theme') {
      const theme = P.themes.find((item) => item.id === root.getAttribute('data-theme'));
      return '"' + (theme ? theme.label : '') + '"';
    }
    if (name === 'fontSize') return String(state.fontSize || defaultFont);
    if (name === 'wordWrap' || name === 'lineNumbers') return '"' + state[name] + '"';
    return String(state[name]);
  }

  // Updates every copy of the file: the second editor group may show one too.
  function render(skip) {
    document.querySelectorAll('[data-setting]').forEach((control) => {
      const name = control.dataset.setting;
      const text = valueText(name);
      if (control.tagName === 'INPUT') {
        if (control !== skip) control.value = text;
        return;
      }
      control.textContent = text;
      control.setAttribute(
        'aria-label',
        NAMES[name] + ' is ' + text.replace(/"/g, '') + '. Change',
      );
    });
  }

  function apply(skip) {
    if (state.fontSize) root.style.setProperty('--fs-code', state.fontSize + 'px');
    else root.style.removeProperty('--fs-code');
    root.classList.toggle('no-wrap', state.wordWrap === 'off');
    root.classList.toggle('no-line-numbers', state.lineNumbers === 'off');
    root.classList.toggle('no-minimap', !state.minimap);
    root.classList.toggle('no-motion', !state.animations);
    P.reducedMotion = systemReduced || !state.animations;
    render(skip);
    document.dispatchEvent(new CustomEvent('portfolio:settings', { detail: state }));
  }

  // A short glow on the value that just changed.
  function pulse(name) {
    document.querySelectorAll('[data-setting="' + name + '"]').forEach((control) => {
      control.classList.remove('is-changed');
      void control.offsetWidth;
      control.classList.add('is-changed');
    });
  }

  function change(name, value, skip) {
    if (name === 'fontSize') {
      const size = Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(Number(value))));
      if (!size) return;
      state.fontSize = size === defaultFont ? null : size;
    } else {
      state[name] = value;
    }
    save();
    apply(skip);
    pulse(name);
    P.flash(NAMES[name] + ': ' + valueText(name));
  }

  function toggle(name) {
    if (name === 'theme') {
      P.cycleTheme();
      pulse(name);
      return;
    }
    if (name === 'wordWrap' || name === 'lineNumbers') {
      change(name, state[name] === 'on' ? 'off' : 'on');
    } else {
      change(name, !state[name]);
    }
  }

  function reset() {
    Object.assign(state, DEFAULTS);
    const light = window.matchMedia('(prefers-color-scheme: light)').matches;
    P.setTheme(light ? 'paper' : 'midnight');
    save();
    apply();
    Object.keys(NAMES).forEach(pulse);
    P.flash('Settings reset to defaults');
  }

  // ---------- Events (delegated, so copies of the file work too) ----------

  document.addEventListener('click', (event) => {
    const control = event.target.closest('button[data-setting]');
    if (control) return toggle(control.dataset.setting);
    const step = event.target.closest('[data-setting-step]');
    if (step)
      return change('fontSize', (state.fontSize || defaultFont) + Number(step.dataset.settingStep));
    if (event.target.closest('[data-setting-reset]')) reset();
  });

  // Typing a size applies it once it is a valid number; leaving the field
  // puts back a value in range.
  document.addEventListener('input', (event) => {
    const field = event.target.closest('input[data-setting="fontSize"]');
    if (!field) return;
    const size = Number(field.value);
    if (size >= FONT_MIN && size <= FONT_MAX) change('fontSize', size, field);
  });

  document.addEventListener(
    'blur',
    (event) => {
      if (event.target.matches && event.target.matches('input[data-setting="fontSize"]')) render();
    },
    true,
  );

  document.addEventListener('keydown', (event) => {
    const field = event.target.closest && event.target.closest('input[data-setting]');
    if (field && event.key === 'Enter') field.blur();
  });

  document.addEventListener('portfolio:theme', () => render());

  apply();

  P.settings = state;
  P.syncSettings = () => render();
  P.changeSetting = (name, value) => (name in NAMES ? (change(name, value), true) : false);
})();
