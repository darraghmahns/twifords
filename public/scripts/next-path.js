/** Only allow same-site relative paths as a post-login destination. Shared by the browser and lib/session.js. */
export function safeNextPath(candidate) {
  if (typeof candidate !== 'string') return '/';
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\')) return '/';
  if (/[\r\n]/.test(candidate)) return '/';
  if (candidate === '/login' || candidate.startsWith('/login?') || candidate.startsWith('/api/')) return '/';
  return candidate;
}
