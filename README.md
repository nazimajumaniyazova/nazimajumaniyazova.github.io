# Portfolio

Personal portfolio of Nazima Jumaniyazova.

Live: https://nazimajumaniyazova.github.io/portfolio/

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
index.html
src/
  css/main.css        compiled styles, do not edit by hand
  sass/               abstracts (tokens, mixins), base, layout, components
  js/
    main.js           menu, section reveal, scroll hint
    hero.js           letter-by-letter title and typed words
    globe.js          canvas globe in the background
    cursor.js         follower ring, magnetic buttons
    projects.js       card tilt, video preview, detail view
  img/  files/
```

## Adding a project

Copy a `<li>` inside `.projects` in `index.html` and change the link, screenshot
(960x600, WebP), name, description and tags. Optional attributes on the card link:

- `data-code="https://github.com/..."` adds a "View code" button to the detail view.
- `data-video="./src/video/name.mp4"` plays a muted preview on hover.
