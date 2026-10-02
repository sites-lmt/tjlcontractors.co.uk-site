# TJL Contractors — static site

tjlcontractors.co.uk rebuilt as a static HTML/CSS/JS site, in the same family as the
other Umbrella sites (`Find Umbrella`, `IFL Contracts`, `Milton Contracts`, `Mavan Services`)
but with its own visual identity.

**Brand:** violet → indigo gradient (`#A05BFB` → `#554D89`), sampled from the TJL logo.
**Type:** Outfit (headings) + Figtree (body).

## Structure

- `index.html` — homepage
- `css/style.css` — the whole design system. Every colour is a token in `:root`.
- `js/tax.js` — shared UK tax engine, **2026/27 rates**. Exposes `window.TaxCalc`.
- `js/site.js` — nav toggle, FAQ accordion, scroll reveal, footer year
- `js/calculator.js` — wires the take-home calculator to `TaxCalc`
- `images/` — logo and favicon

## URL policy

Slugs are preserved from the previous WordPress site so existing links and any
search rankings survive the move. Pages are folders with an `index.html`, not flat
`.html` files, which is what keeps `/about/` rather than `/about.html`.

Carried over: `/about/`, `/services/`, `/umbrella/`, `/self-assessment/`,
`/how-to-file-for-self-assessment/`, `/calculator/`, `/guides/`, `/contact/`,
`/refer-contractor/`, `/refer-recruiter/`, `/privacy-policy/`, `/terms-conditions/`

Added: `/pricing/`, `/how-it-works/`, `/ir35/`, `/faq/`, `/cookie-policy/`

**Deliberately not carried over:** `/welcome-to-cloudways/`, which was a leftover
Cloudways setup placeholder still live and indexable on the old site.

## Conventions

- Every page repeats the topbar/header/footer — keep them in sync.
- Pages one level deep use `../` prefixes for assets and links.
- Calculators pull constants from `js/tax.js` — never hardcode a rate in a page.
- The header is solid white on purpose: the supplied logo PNG has a white plate, so a
  white background makes it invisible. The footer puts the same logo in a white chip.

## Tax engine

`js/tax.js` handles the taper correctly: above £100,000 **both** the personal
allowance and the basic-rate limit reduce by £1 per £2. Omitting the basic-rate taper
over-extends the 20% band and understates tax — at £120,000 that is roughly £2,000.

Verified figures: £50,000 → £7,486 · £60,000 → £11,432 · £120,000 → £41,432 ·
£125,140 → £45,030.

## Deployment

Static GitHub Pages. Repo: `sites-lmt/tjlcontractors.co.uk-site`.

`www.tjlcontractors.co.uk` is the canonical host (see `CNAME`). The DNS cutover from
the old Cloudways/WordPress host has **not** been done — the previous site is still
live and serving.

## Still to confirm with the client

- **Umbrella payroll fee.** The pricing page quotes self-assessment at £105 (given) but
  presents umbrella pricing as "agreed up front" because we do not have the figure.
  A transparent number is a trust signal on a fees page — worth getting.
- **Registered company details** (company number, registered office). Not on the site yet.
- **Social profiles** — none linked. The other sites have them.
- **Google Fonts** load from Google's CDN, so visitor IPs reach Google. Self-hosting the
  fonts would remove that; the privacy policy currently discloses it honestly.
