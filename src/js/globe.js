// Wireframe globe on a 2D canvas. It turns slowly on its own, turns faster
// with page scroll, leans a little towards the pointer and marks Tashkent.
(() => {
  const canvas = document.getElementById('globe');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEG = Math.PI / 180;

  const TASHKENT = { lat: 41.31, lon: 69.24, label: 'Tashkent' };
  const START_ROTATION = -86 * DEG; // Tashkent faces the viewer at the top of the page
  const AUTO_SPEED = 0.04; // radians per second
  const SCROLL_SPEED = 0.0022; // radians per scrolled pixel
  const BASE_TILT = 20 * DEG;
  const GRID_STEP = 15; // degrees between grid lines
  const LINE_STEP = 5; // degrees between points on a line

  let size = 0;
  let tilt = BASE_TILT;
  let targetTilt = BASE_TILT;
  let autoRotation = 0;
  let lastTime = 0;
  let frame = 0;

  // Longitude/latitude in degrees to canvas coordinates. z > 0 is the near side.
  const project = (lat, lon, rotation, radius) => {
    const phi = lat * DEG;
    const lambda = lon * DEG + rotation;
    const x = Math.cos(phi) * Math.sin(lambda);
    const y = Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(lambda);
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    return {
      x: size / 2 + radius * x,
      y: size / 2 - radius * (y * cosT - z * sinT),
      z: y * sinT + z * cosT,
    };
  };

  const resize = () => {
    const cssSize = canvas.clientWidth;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    size = cssSize;
    canvas.width = Math.round(cssSize * ratio);
    canvas.height = Math.round(cssSize * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const draw = (time) => {
    const rotation = START_ROTATION + autoRotation + window.scrollY * SCROLL_SPEED;
    const radius = size * 0.42;
    tilt += (targetTilt - tilt) * 0.05;

    ctx.clearRect(0, 0, size, size);

    // Grid lines are collected into a near path and a far path so each side
    // is stroked once with its own opacity.
    const near = new Path2D();
    const far = new Path2D();
    const addLine = (points) => {
      for (let i = 1; i < points.length; i += 1) {
        const a = points[i - 1];
        const b = points[i];
        const path = a.z + b.z > 0 ? near : far;
        path.moveTo(a.x, a.y);
        path.lineTo(b.x, b.y);
      }
    };

    for (let lat = -75; lat <= 75; lat += GRID_STEP) {
      const points = [];
      for (let lon = 0; lon <= 360; lon += LINE_STEP) {
        points.push(project(lat, lon, rotation, radius));
      }
      addLine(points);
    }
    for (let lon = 0; lon < 360; lon += GRID_STEP) {
      const points = [];
      for (let lat = -90; lat <= 90; lat += LINE_STEP) {
        points.push(project(lat, lon, rotation, radius));
      }
      addLine(points);
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.stroke(far);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.stroke(near);

    // Outline
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.stroke();

    // Tashkent marker: bright with a pulse on the near side, dim on the far side.
    const marker = project(TASHKENT.lat, TASHKENT.lon, rotation, radius);
    if (marker.z > 0) {
      const pulse = reducedMotion ? 0.5 : (time / 1800) % 1;
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 4 + pulse * 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(227, 175, 0, ${0.8 * (1 - pulse)})`;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#e3af00';
      ctx.fill();

      ctx.font = '600 13px "Source Sans Pro", sans-serif';
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, marker.z * 3)})`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.fillText(TASHKENT.label, marker.x - 12, marker.y);
    } else {
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(227, 175, 0, 0.2)';
      ctx.fill();
    }
  };

  const loop = (time) => {
    const delta = lastTime ? Math.min(time - lastTime, 100) : 0;
    lastTime = time;
    autoRotation += (delta / 1000) * AUTO_SPEED;
    draw(time);
    frame = requestAnimationFrame(loop);
  };

  const start = () => {
    if (reducedMotion || frame) return;
    lastTime = 0;
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  resize();
  draw(0);
  window.addEventListener('resize', () => {
    resize();
    draw(performance.now());
  });

  if (reducedMotion) {
    // No animation loop: the globe only follows the scroll position.
    window.addEventListener('scroll', () => draw(0), { passive: true });
    return;
  }

  window.addEventListener(
    'pointermove',
    (event) => {
      const offset = event.clientY / window.innerHeight - 0.5;
      targetTilt = BASE_TILT + offset * 16 * DEG;
    },
    { passive: true },
  );

  // Do not burn battery in a background tab.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  start();
})();
