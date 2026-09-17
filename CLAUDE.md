# The Twifords Try D.C.

A password-protected, multi-page wedding gift site for Jack & Anne Twiford. Four D.C.
restaurants, each with a real gift card. Static HTML/CSS/JS in `public/`, gated by
Vercel Routing Middleware, with three Vercel Functions in `api/`.

## Commands

```bash
npm run dev    # http://localhost:4173 with automatic refresh
npm run build  # generate the eight guide pages
npm test       # build pages, then run the Node test suite
```

The dev server loads `.env.local`, runs the real middleware and API handlers, and
watches public assets for browser refresh. Changes to the page template, artwork,
and restaurant data automatically regenerate the HTML. Restart for server changes.
Vercel runs `npm run build` and serves the `public/` directory with clean URLs.

## Page structure

- `/`: restaurant guide and personal introduction
- `/map`: interactive map and restaurant list
- `/gift-cards`: links to all four private gift cards
- `/about`: a simple welcome
- `/restaurants/<id>`: complete restaurant page and authenticated gift card panel
- `/login`: password form
- `/dc-map`: the Leaflet map frame used by `/map`

These are separate HTML documents with ordinary links. Restaurant content and
navigation work without JavaScript. Private card details and the interactive map
use progressive enhancement. The login and logout forms also submit without JS.

## Editing

- `scripts/build-pages.mjs`: shared HTML layout and page copy. Edit this source,
  then build; do not hand-edit its generated pages.
- `scripts/artwork.mjs`: original inline SVG dining illustrations.
- `public/scripts/restaurants.js`: public restaurant details and gift metadata.
- `public/styles/organic.css`: local font declarations, tokens, and basic controls.
- `public/styles/site.css`, `login.css`, `map.css`: page styles.
- `public/scripts/site.js`: private card loading, copying, map selection.
- `public/scripts/voucher-model.js`: pure gift card view model.

Keep the original cream, red, and rose palette, Caprasimo headings, and gentle
heart animations. Respect reduced motion. Do not use em dash characters.

## Access and private data

1. `middleware.js` gates every page except login and its required assets.
2. `api/login.js` checks `SITE_PASSWORD`, rate-limits attempts, and sets an HttpOnly,
   SameSite=Lax, 30-day cookie signed with `SESSION_SECRET`.
3. `api/gift-cards.js` rechecks the cookie and returns `GIFT_CARDS_JSON` without caching.
4. `api/logout.js` clears the cookie and redirects native form submissions to login.

Environment variables: `SITE_PASSWORD`, `SESSION_SECRET` (at least 32 characters),
`GIFT_CARDS_JSON`. Use `.env.local` locally. Gift card codes, PINs, and private card
URLs must stay in the git-ignored `secrets/` files and the environment variable.
Never put them in static HTML, browser source, tests, or committed files.

Every restaurant needs gift-card metadata. If changing the restaurant list, update
the matching private configuration separately. Original gift values are not live
balances; do not invent redemption restrictions.

New assets used by login must be allowed by `isPublicPath` in `lib/session.js`.
Map messages check both the same origin and the expected source window.
