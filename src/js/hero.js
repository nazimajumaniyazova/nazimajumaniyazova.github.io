// First screen: the name appears letter by letter and the stack line is typed.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Split the title into letters -----------------------------------------
  const title = document.querySelector('.hero__title');
  if (title) {
    const text = title.textContent.trim();
    // Screen readers get the whole name, not eighteen separate letters.
    title.setAttribute('aria-label', text);
    title.textContent = '';

    let index = 0;
    text.split(' ').forEach((word, wordIndex, words) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'hero__word';
      wordEl.setAttribute('aria-hidden', 'true');
      [...word].forEach((char) => {
        const charEl = document.createElement('span');
        charEl.className = 'hero__char';
        charEl.style.setProperty('--i', index);
        charEl.textContent = char;
        wordEl.append(charEl);
        index += 1;
      });
      title.append(wordEl);
      if (wordIndex < words.length - 1) title.append(' ');
    });
    title.classList.add('is-split');
  }

  // --- Typed words ------------------------------------------------------------
  const typed = document.querySelector('.typed');
  if (!typed || reducedMotion) return;

  const words = typed.dataset.words.split('|');
  const TYPE_MS = 85;
  const DELETE_MS = 45;
  const HOLD_MS = 1700;
  const START_DELAY_MS = 2600; // after the intro animation has finished

  let wordIndex = 0;
  let length = words[0].length;
  let deleting = true;

  const tick = () => {
    const word = words[wordIndex];
    length += deleting ? -1 : 1;
    typed.textContent = word.slice(0, length);

    let delay = deleting ? DELETE_MS : TYPE_MS;
    if (deleting && length === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
    } else if (!deleting && length === word.length) {
      deleting = true;
      delay = HOLD_MS;
    }
    setTimeout(tick, delay);
  };

  setTimeout(tick, START_DELAY_MS);
})();
