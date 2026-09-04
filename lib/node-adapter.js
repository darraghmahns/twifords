// Vercel's Node.js runtime invokes api/*.js with Node's (IncomingMessage, ServerResponse) pair, while the
// dev server and tests use Web Request/Response. This wraps a Web-style handler so it works with both.

async function toWebRequest(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `${proto}://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const hasBody = !['GET', 'HEAD'].includes(req.method || 'GET');
  let body;
  if (hasBody) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }
  return new Request(url, { method: req.method, headers, body });
}

async function writeNodeResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') res.setHeader(key, value);
  });
  const cookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  if (cookies.length) res.setHeader('set-cookie', cookies);
  const buf = Buffer.from(await response.arrayBuffer());
  res.end(buf);
}

const isWebRequest = (value) => value && typeof value.headers?.get === 'function' && typeof value.url === 'string';

/** Wraps `handler(request: Request): Promise<Response>` so Vercel can call it as (req, res). */
export function nodeHandler(handler) {
  return async function adapted(reqOrRequest, res) {
    if (isWebRequest(reqOrRequest)) return handler(reqOrRequest);
    let response;
    try {
      response = await handler(await toWebRequest(reqOrRequest));
    } catch (err) {
      console.error(err);
      response = new Response(JSON.stringify({ error: 'Something went wrong.' }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
    await writeNodeResponse(res, response);
  };
}
