# The Twifords Try D.C.

A password-protected, one-page wedding gift site for Jack & Anne Twiford: four D.C. restaurants
on a map, each with a real gift card. Static HTML/CSS/JS in `public/`, gated by Vercel Routing
Middleware, with three small Vercel Functions in `api/`. No build step, one runtime dependency
(`@vercel/functions`).

## How access works

1. `middleware.js` runs on every request. Only the login page and its CSS/fonts are public
   (`isPublicPath` in `lib/session.js`). Everything else needs a valid `twiford_session` cookie
   or gets redirected to `/login` (pages) / a 401 (API).
2. `api/login.js` checks the password against `SITE_PASSWORD` (constant-time), rate-limits by IP,
   and sets an HttpOnly, SameSite=Lax, 30-day cookie signed with HMAC-SHA256 using `SESSION_SECRET`.
3. `api/gift-cards.js` re-checks the cookie and returns `GIFT_CARDS_JSON` (the codes). The browser
   fetches it after login; codes are never in any static file or in git.
4. `api/logout.js` clears the cookie.

## Environment variables

| Name | Purpose |
|---|---|
| `SITE_PASSWORD` | What Jack & Anne type to open the site |
| `SESSION_SECRET` | ≥32 chars, `openssl rand -hex 32` |
| `GIFT_CARDS_JSON` | Minified `secrets/gift-cards.json` (shape in `secrets/gift-cards.example.json`) |

Local: copy `.env.example` to `.env.local`. Production: `vercel env add NAME production`
(for the JSON: `vercel env add GIFT_CARDS_JSON production < secrets/gift-cards.json`).

## Layout

- `public/index.html` the book · `public/dc-map.html` Leaflet map in an iframe · `public/login.html`
- `public/styles/organic.css` design-system tokens/components from Claude Design; `palette.css` red overlay;
  `site.css`, `map.css`, `login.css` page layout
- `public/scripts/restaurants.js` the four tables (public data only, `giftCard` is metadata not codes)
- `public/scripts/voucher-model.js` pure view-model for the gift card panel
- `lib/session.js`, `lib/rate-limit.js`, `lib/handlers.js` shared by middleware, functions, dev server, tests
- `scripts/dev-server.mjs` local Vercel stand-in (runs the real middleware + handlers)
- `secrets/gift-cards.json` git-ignored source of truth for the codes
- `tests/` `node --test`

## Commands

```bash
npm test
npm run dev      # http://localhost:4173, reads .env.local
```

## Rules for this repo

- Gift card codes, PINs, and card URLs only ever live in `secrets/` and the `GIFT_CARDS_JSON` env var.
  `tests/public-assets.test.js` fails if a secret shows up anywhere under `public/`.
- To add or remove a restaurant: edit `restaurants.js` (every entry needs `giftCard` metadata), the secrets
  file, and the env var in Vercel.
- Any new public asset the login page needs must be added to `isPublicPath` (and its test).
- Pages talk to the map iframe with `postMessage` and check `event.origin`; keep that.
