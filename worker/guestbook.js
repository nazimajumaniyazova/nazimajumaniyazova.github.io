// Cloudflare Worker for the portfolio's visit statistics.
//
// The site (src/js/guestbook.js) posts page views and events here, and this
// Worker passes them on to GoatCounter's API with the visitor's IP address and
// User-Agent, so GoatCounter can tell unique visitors and countries apart as
// usual. GoatCounter's own address is on ad blockers' lists, this one is not.
// Neither the IP nor the User-Agent is stored here.
//
// Settings (the Worker > Settings > Variables and Secrets):
//   GOATCOUNTER_TOKEN  Secret. A GoatCounter API key with "Record pageviews".
//   GOATCOUNTER_SITE   Text. The site code: nazima for nazima.goatcounter.com.
//   ALLOWED_ORIGIN     Text. https://nazimajumaniyazova.github.io
//
// Setup steps are in README.md, "Statistics".

const MAX_BODY = 16 * 1024;
const MAX_HITS = 20;

function text(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

// Only the fields the site sends, with sane sizes; anything else is dropped.
function clean(hit) {
  if (!hit || typeof hit !== 'object') return null;
  const path = text(hit.path, 100);
  if (!/^[\w./-]+$/.test(path)) return null;
  const out = { path: path, event: hit.event === true };
  const title = text(hit.title, 200);
  if (title) out.title = title;
  const ref = text(hit.ref, 500);
  if (ref) out.ref = ref;
  const language = text(hit.language, 35);
  if (/^[A-Za-z]{2,3}(-[A-Za-z0-9]{1,8})*$/.test(language)) out.language = language;
  if (Array.isArray(hit.size)) {
    const size = hit.size.slice(0, 3).map(Number).filter(Number.isFinite);
    if (size.length) out.size = size;
  }
  if (Number.isInteger(hit.bot) && hit.bot >= 0 && hit.bot < 1000) out.bot = hit.bot;
  return out;
}

async function forward(env, hits) {
  let response;
  try {
    response = await send(env, hits);
  } catch (e) {
    console.error('GoatCounter is unreachable', e);
    return;
  }
  // Shows up in the Worker's logs (Observability).
  if (!response.ok) console.error('GoatCounter answered', response.status, await response.text());
}

function send(env, hits) {
  return fetch('https://' + env.GOATCOUNTER_SITE + '.goatcounter.com/api/v0/count', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + env.GOATCOUNTER_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ no_sessions: true, hits: hits }),
  });
}

export default {
  async fetch(request, env, ctx) {
    const allowed = env.ALLOWED_ORIGIN;
    const cors = {
      'Access-Control-Allow-Origin': allowed || '',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return new Response('Not found', { status: 404 });
    if (!allowed || request.headers.get('Origin') !== allowed)
      return new Response('Forbidden', { status: 403 });
    if (!env.GOATCOUNTER_TOKEN || !env.GOATCOUNTER_SITE)
      return new Response('Not configured', { status: 500, headers: cors });

    const raw = await request.text();
    if (raw.length > MAX_BODY) return new Response('Too large', { status: 413, headers: cors });
    let body;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      return new Response('Bad request', { status: 400, headers: cors });
    }
    const hits = (Array.isArray(body && body.hits) ? body.hits : [])
      .slice(0, MAX_HITS)
      .map(clean)
      .filter(Boolean);
    if (!hits.length) return new Response('Bad request', { status: 400, headers: cors });

    const ip = request.headers.get('CF-Connecting-IP');
    const agent = request.headers.get('User-Agent');
    hits.forEach((hit) => {
      if (ip) hit.ip = ip;
      if (agent) hit.user_agent = agent;
    });

    // Answer right away; the call to GoatCounter finishes in the background.
    ctx.waitUntil(forward(env, hits));
    return new Response(null, { status: 204, headers: cors });
  },
};
