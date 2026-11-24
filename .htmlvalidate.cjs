// html-validate for index.html. The rules turned off below are deliberate.
module.exports = {
  extends: ['html-validate:recommended'],
  rules: {
    // Prettier writes `<!doctype html>` and `<br />`; the formatter wins.
    'doctype-style': 'off',
    'void-style': 'off',
    // The search and the terminal are one-field forms: Enter submits them,
    // and a hidden submit button would be an invisible Tab stop.
    'wcag/h32': 'off',
    // The command palette is an ARIA combobox with a listbox; <select> cannot
    // filter as you type.
    'prefer-native-element': ['error', { exclude: ['listbox'] }],
  },
};
