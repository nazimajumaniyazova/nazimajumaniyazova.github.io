# Portfolio

Personal portfolio of Nazima Jumaniyazova, built to look and work like a code editor.

Live: https://nazimajumaniyazova.github.io/portfolio/

## What it does

- Every section is a "file" that opens in a tab: `README.md`, `about.md`, `skills.json` and so on.
- The terminal understands commands: `help`, `ls`, `open about.md`, `cat skills.json`, `git log`, `theme paper`.
- `Ctrl K` opens a search over files and commands. `Ctrl J` toggles the terminal, `Ctrl B` the explorer.
- Three color themes: Midnight, Paper, Sunset. The choice is remembered.

## Stack

Plain HTML, Sass and vanilla JavaScript. No runtime libraries.

## Development

```bash
npm install
npm run dev      # watch Sass and rebuild src/css/main.css
npm run build    # one-off compressed build
npm run format   # Prettier for HTML, JS and SCSS
```

Open `index.html` with any static server, for example the Live Server extension.

GitHub Pages serves the repository as is, so `src/css/main.css` is committed.
Run `npm run build` before every commit that touches `src/sass`.

## Structure

```
index.html            all content: each <article class="file"> is one file
src/
  css/main.css        compiled styles, do not edit by hand
  sass/
    abstracts/        tokens (colors of every theme), mixins
    base/             reset, global styles, syntax colors
    layout/_ide       title bar, activity bar, explorer, status bar
    components/       editor, preview, terminal, palette, search, hover cards
  js/
    app.js            files and tabs, side bar views, themes, status bar
    search.js         Ctrl Shift F search in all files
    terminal.js       terminal commands, "▶ Run" for projects
    palette.js        Ctrl K search
    hover.js          skill hover cards ("Used at")
  img/  files/
```

## Editing content

Content lives in `index.html`. Each line of a file is an element with the class `l`;
line numbers are added by CSS. Indent with `i1` to `i4`. Syntax colors are short classes:
`k` keyword, `s` string, `n` property, `c` comment, `f` function, `t` tag, `h` heading,
`m` punctuation.

## Adding a project

1. Copy an `<article class="file file--split">` block in `index.html` and give it a new `id`,
   `data-name` and `data-path`.
2. Change the name, links, description and the screenshot (960x600, WebP) in the preview.
3. Add a link with the same `#id` to the `projects` folder in the explorer.

The tab, the terminal (`ls`, `open`, `cat`, `run`), the search, the "▶ Run" lens and the
skill hover cards pick the new file up automatically. Run reads the project name, the first
link and the `skill` items from the file itself.

## Adding a terminal command

Add an entry to `COMMANDS` in `src/js/terminal.js`. Entries with an `about` text show up in `help`.
