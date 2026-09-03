import { safeNextPath } from './next-path.js';

const form = document.getElementById('login-form');
const errorEl = document.getElementById('login-error');
const submitEl = document.getElementById('login-submit');
const params = new URLSearchParams(window.location.search);
const nextPath = safeNextPath(params.get('next'));

// Keep the no-JS fallback (a plain form POST) pointed at the same destination.
document.getElementById('login-next').value = nextPath;
if (params.get('error') === 'password') showError('That is not the password. Try again.');
if (params.get('error') === 'rate') showError('Too many tries. Please wait a few minutes and try again.');

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

async function readError(response) {
  try {
    const body = await response.json();
    if (body && typeof body.error === 'string') return body.error;
  } catch {
    // fall through to the generic message
  }
  return 'Something went wrong. Please try again.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = form.elements.password.value;
  if (!password) {
    showError('Please enter the password.');
    form.elements.password.focus();
    return;
  }
  showError('');
  submitEl.disabled = true;
  submitEl.textContent = 'Opening…';
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password }),
    });
    if (response.status === 204) {
      window.location.replace(nextPath);
      return;
    }
    showError(await readError(response));
    form.elements.password.select();
  } catch (err) {
    console.error(err);
    showError('Could not reach the site. Check your connection and try again.');
  } finally {
    submitEl.disabled = false;
    submitEl.textContent = 'Open the book';
  }
});
