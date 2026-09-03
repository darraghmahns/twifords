// Vercel Routing Middleware: everything except the login page requires a valid session cookie.
import { next } from '@vercel/functions';
import { isPublicPath, hasValidSession } from './lib/session.js';

export const config = { runtime: 'nodejs' };

export default async function middleware(request) {
  const url = new URL(request.url);
  if (isPublicPath(url.pathname)) return next();

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error('middleware: SESSION_SECRET is not set');
    return new Response('The site is not configured yet.', { status: 500, headers: { 'cache-control': 'no-store' } });
  }

  if (await hasValidSession(request, secret)) return next();

  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Please sign in first.' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const login = new URL('/login', url);
  if (url.pathname !== '/' && request.method === 'GET') login.searchParams.set('next', url.pathname + url.search);
  return new Response(null, { status: 302, headers: { location: login.toString(), 'cache-control': 'no-store' } });
}
