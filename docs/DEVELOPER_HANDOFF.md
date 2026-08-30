# Wag & Walk Middleton Website Handoff Guide

Last reviewed: 24 July 2026

This document should be read before making future changes to the Wag & Walk Middleton website. It explains how the site is structured, how key features work, what can go wrong, and what to check before deployment.

For Google Analytics 4, analytics consent and event tracking, read `docs/analytics.md` before changing the website header, footer, contact form, Content Security Policy or Worker.

## Site Overview

The site is a static HTML website for Wag & Walk Middleton, deployed to Cloudflare Pages.

Primary domain:

- `https://www.wagandwalk.uk/`

Canonical domain:

- Always use `https://www.wagandwalk.uk`
- Do not use non-www canonicals.
- Do not use `/index.html` as a canonical URL.

Technology:

- Static HTML
- Plain CSS
- Small vanilla JavaScript files
- No framework
- No build step
- No package manager required for the main website

Local preview:

```bash
python3 -m http.server 8773
```

Open:

```text
http://127.0.0.1:8773/
```

If that port is busy, use a different port.

## Important Rule Before Editing

Before making changes, check:

- The page-specific HTML file.
- Shared CSS in `css/styles.css`.
- Any feature CSS file used by that page.
- `sitemap.xml` if adding, removing, renaming or hiding a public page.
- Canonical tags and Open Graph URLs if changing URLs.
- LocalBusiness or BlogPosting schema if changing services, pricing, contact details or articles.
- `_redirects` and Cloudflare dashboard redirect rules if changing URL behaviour.

## File Structure

Main public pages:

- `index.html` - Homepage
- `about.html` - About page and DBS status section
- `services.html` - Dog walking services
- `pet-visits.html` - House visits
- `flex-credits.html` - Flex Credits
- `prices.html` - Pricing
- `reviews.html` - Reviews
- `contact.html` - Contact form and contact information
- `policies.html` - Service policies
- `client-registration.html` - Client onboarding/registration page
- `dog-walker-near-me.html` - Local search landing page
- `blog.html` - Blog index

Area pages:

- `areas/dog-walker-middleton.html`
- `areas/dog-walker-rhodes.html`
- `areas/dog-walker-alkrington.html`
- `areas/dog-walker-bowlee.html`
- `areas/dog-walker-langley.html`
- `areas/dog-walker-simister.html`
- `areas/dog-walker-blackley.html`
- `areas/dog-walker-chadderton.html`
- `areas/dog-walker-mills-hill.html`
- `areas/dog-walker-hopwood-hall.html`
- `areas/dog-walker-firwood-park.html`
- `areas/dog-walker-westwood.html`
- `areas/dog-walker-rochdale.html`
- `areas/dog-walker-manchester.html`
- `areas/dog-walker-m24.html`

Blog articles:

- `blog/*.html`

Behind The Lead content:

- `behind-the-lead.html`
- `behind-the-lead/*.html`

Important: Behind The Lead is currently public and indexable. Keep its index page, article pages, blog links, footer links and sitemap entries in sync.

Wag & Web microsite:

- `web/`

This is a separate static sub-site intended for `https://web.wagandwalk.uk/`. Treat it as separate from the main dog walking site.

## Styling

Main stylesheet:

- `css/styles.css`

Supporting stylesheets:

- `css/social-footer.css` - footer social icons
- `css/blog-index.css` - blog listing and article cards
- `css/behind-the-lead.css` - Behind The Lead styling
- `css/dbs-check.css` - DBS status section
- `css/near-me.css` - dog walker near me page
- `css/onboarding.css` - client registration page

Design rules:

- Use the existing forest green, white and light grey style.
- Reuse existing components such as `.section`, `.container`, `.feature`, `.info-card`, `.service-card`, `.price-card`, `.callout`, `.button`, `.faq-list`.
- Avoid adding a new visual style unless there is a very clear reason.
- Do not introduce frameworks.

Known CSS note:

- Some pages use cache-busted CSS links such as `css/styles.css?v=20260711-prices`. This was used to force browsers to load pricing layout fixes.
- If a visual change does not appear in preview, check whether the page is loading a cached stylesheet. A temporary query string can be used to force refresh.

## JavaScript

Main JavaScript:

- `js/main.js`

Responsibilities:

- Mobile navigation toggle.
- Service Areas dropdown toggle.
- Dynamic footer year.
- Instagram feed iframe resizing.
- Blog article filters.

Contact form JavaScript:

- `js/contact-form.js`

Responsibilities:

- Prefills the message field from `?message=...`.
- Generates a stable `websiteSubmissionId` for each submission attempt.
- Posts the form to `/api/contact`.
- Shows loading, success and retryable error states.

Registration JavaScript:

- `js/registration.js`

Responsibilities:

- Expands/collapses the Google onboarding form.
- Updates the URL hash to `#client-registration-form` when the form is open.
- Opens the form automatically when visiting `client-registration.html#client-registration-form`.
- Scrolls to the green callout above the form.

Contact prefill JavaScript:

- `js/contact-prefill.js`

Note:

- `js/main.js` already includes contact message prefill logic for `?message=...`.
- If future edits add `contact-prefill.js` separately, avoid duplicating behaviour.

## Forms

Contact form:

- Located in `contact.html`.
- Uses `data-contact-form`, which is handled by `js/contact-form.js`.
- Posts to the Cloudflare Worker route `/api/contact`.
- The Worker validates the form, signs the Hub request server-side and forwards it to the Hub lead ingestion endpoint.
- Query parameter `?message=...` pre-fills the message field.
- First name, surname, postcode, message and consent are required. The visitor must also provide at least one contact method: email or phone.
- The browser validates UK postcode formatting and email/phone formatting; the Worker repeats those checks so invalid submissions cannot bypass browser validation.
- Phone is optional, but must be valid when provided.
- The form sends a meet-and-greet request only. It must not claim that a meet and greet has been booked automatically.
- Do not add onboarding, key-safe, vet, medical, payment or recurring booking details to the public website form. Those belong in the Hub onboarding flow.

Required Cloudflare Worker environment variables:

- `HUB_BASE_URL=https://hub.wagandwalk.uk`
- `WEBSITE_INGESTION_SECRET` as an encrypted secret

Security rules:

- Never expose `WEBSITE_INGESTION_SECRET` in public HTML or browser JavaScript.
- Only send fields accepted by the Hub website lead contract.
- Keep honeypot/spam fields out of the Hub payload.
- Keep request bodies below 12 KB.

Example DBS request link:

```text
/contact.html?message=Hello%20Nathan%2C%20I%20would%20like%20to%20request%20a%20copy%20of%20your%20DBS%20certificate%20for%20verification%20before%20booking.#contact-form
```

Client registration form:

- Located in `client-registration.html`.
- Embedded Google Form iframe.
- JavaScript-controlled expand/collapse.
- Shareable open-form URL:

```text
/client-registration.html#client-registration-form
```

External Google Form:

- The form itself is hosted by Google.
- Questions inside the embedded form must be changed in Google Forms, not in this repo.
- The website page can change the surrounding copy, button behaviour and embed container only.

## Pricing Model

Current visible pricing:

Regular bookings:

- 30 min solo walk: `£12`
- 60 min solo walk: `£18`
- Additional pet from the same household: `+ £5`

Recurring bookings:

- 30 min solo walk: `£11`
- 60 min solo walk: `£16`
- Additional pet from the same household: `+ £4`

House visits:

- House visit: `£11`

Flex Credits:

- Flex 30: `£15`
- Flex 60: `£20`

Flex packs:

- 5 x Flex 30: `£75`
- 10 x Flex 30: `£145`
- 20 x Flex 30: `£280`
- 5 x Flex 60: `£100`
- 10 x Flex 60: `£195`
- 20 x Flex 60: `£380`

When pricing changes:

- Update visible prices on `prices.html`.
- Update relevant summaries on `index.html`, `services.html`, and `flex-credits.html`.
- Search all HTML for old prices.
- Update JSON-LD `makesOffer` pricing across pages.
- Check blog articles and Behind The Lead posts before changing historical mentions. Some old prices are part of founder-story content and may be intentionally historical.

Useful search:

```bash
rg -n "£14|£21|£105|£205|£400|\\+ ?£8|price\":\"14\"|price\":\"21\"|price\":\"8\"" . --glob "*.html"
```

## SEO Metadata

Every public page should have:

- `<title>`
- `<meta name="description">`
- Self-referencing canonical using `https://www.wagandwalk.uk`
- Open Graph title, description, URL and image
- Twitter card metadata
- Favicon links
- Structured data where relevant

Canonical rules:

- Homepage canonical: `https://www.wagandwalk.uk/`
- Standard page canonical: `https://www.wagandwalk.uk/page.html`
- Area page canonical: `https://www.wagandwalk.uk/areas/dog-walker-area.html`
- Blog canonical: `https://www.wagandwalk.uk/blog/article-slug.html`
- Never canonicalise to non-www.
- Never canonicalise homepage to `/index.html`.

Common metadata files:

- `sitemap.xml`
- `robots.txt`
- `_headers`
- `_redirects`

## Structured Data

Common schema types in use:

- `LocalBusiness`
- `FAQPage`
- `BlogPosting`
- `WebSite`
- `WebPage`
- `Service` for the Wag & Web microsite

When updating business details:

- Search all HTML for the old phone number, social URL, image, area, or price.
- Update LocalBusiness schema in all relevant pages.

Useful validation check:

```bash
python3 - <<'PY'
from html.parser import HTMLParser
import json, pathlib, sys
class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.in_ld=False; self.buf=[]; self.blocks=[]
    def handle_starttag(self, tag, attrs):
        if tag=='script' and dict(attrs).get('type')=='application/ld+json':
            self.in_ld=True; self.buf=[]
    def handle_data(self, data):
        if self.in_ld: self.buf.append(data)
    def handle_endtag(self, tag):
        if tag=='script' and self.in_ld:
            self.blocks.append(''.join(self.buf)); self.in_ld=False
bad=[]
for folder in ['.', 'areas', 'blog', 'behind-the-lead']:
    for path in pathlib.Path(folder).glob('*.html'):
        p=P(); p.feed(path.read_text())
        for block in p.blocks:
            try: json.loads(block)
            except Exception as e: bad.append((str(path), str(e)))
if bad:
    print('\n'.join(f'{p}: {e}' for p,e in bad)); sys.exit(1)
print('JSON-LD OK')
PY
```

## Sitemap And Robots

Robots file:

- `robots.txt`

Current expected content:

```text
User-agent: *
Allow: /

Sitemap: https://www.wagandwalk.uk/sitemap.xml
```

Sitemap:

- `sitemap.xml`

Rules:

- Include all public, indexable pages.
- Use `https://www.wagandwalk.uk/`.
- Do not include non-www URLs.
- Do not include `/index.html`.
- Include Behind The Lead URLs while the section remains public.
- Remove deleted or redirected pages.

Whenever a page is added:

- Add it to navigation if appropriate.
- Add it to footer if important.
- Add it to `sitemap.xml` if public and indexable.
- Add metadata and structured data.

Whenever a page is removed or hidden:

- Remove it from navigation.
- Remove it from footer if present.
- Remove it from `sitemap.xml`.
- Add a relative redirect in `_redirects` only if needed.

## Redirects And Canonical Domain

Cloudflare Pages redirects:

- `_redirects`

Current redirects:

```text
/index.html / 301
/pickup-dropoff.html /services.html 301
/images/favicon.svg /favicon.ico 301
```

Important:

- Keep `_redirects` relative.
- Do not put absolute domain redirects in `_redirects`.
- Cloudflare static asset redirects can fail deployment if absolute URLs are used in this context.

Non-www to www:

- Handle this in the Cloudflare dashboard using a Redirect Rule.
- Source hostname: `wagandwalk.uk`
- Target: `https://www.wagandwalk.uk/${uri.path}`
- Status: `301`
- Do not use a root-level `_worker.js` for this static deployment unless the Cloudflare setup is intentionally changed.

Cloudflare dashboard may also contain Page Rules or Redirect Rules. Avoid creating conflicting rules that redirect `www` back to non-www or force `.html` to extensionless URLs.

Previous known issue:

- Extensionless redirect rules caused loops when Cloudflare clean URLs and `_redirects` disagreed.
- Avoid redirecting `/about` to `/about.html` if Cloudflare is also trying to serve clean URLs.

## Headers And Security Policy

Headers file:

- `_headers`

Includes:

- `X-Content-Type-Options`
- `Referrer-Policy`
- `X-Frame-Options`
- `Strict-Transport-Security`
- `Permissions-Policy`
- `Content-Security-Policy`

If adding third-party scripts, frames or images:

- Update `_headers` CSP.
- Check `script-src`, `frame-src`, `connect-src`, and `img-src`.

Current external integrations allowed:

- Mirror App Instagram feed
- Google Forms iframe
- jsDelivr iframe bridge
- Google Preferred Sources button (`https://news.google.com/swg/js/v1/publisher.js`)
- WhatsApp links

## Social And External Integrations

Social links:

- Facebook: `https://www.facebook.com/profile.php?id=61590335500811`
- Instagram: `https://www.instagram.com/wagwalkmiddleton`

WhatsApp:

- Phone link uses `https://wa.me/447343058095`
- Displayed phone number is `07343 058 095`

Instagram feed:

- Embedded on homepage using Mirror App iframe.
- Resized through `js/main.js`.
- If the feed fails, check:
  - Mirror App URL still works.
  - `_headers` CSP allows `https://app.mirror-app.com`.
  - `https://cdn.jsdelivr.net` is allowed for the iframe bridge.
  - The iframe has not been blocked by browser privacy tools.

## Content Positioning

Current service positioning:

- Premium solo dog walking.
- No mixed-household group walks.
- Dogs from the same household can be walked together.
- Personalised walks matched to the dog.
- Walks can support:
  - Midday company.
  - Toilet breaks.
  - Regular routine.
  - Physical exercise needs.
  - Individual support for nervous, older, reactive, strong or puppy dogs.

Avoid:

- Group walks.
- Running services.
- Claims that dogs will be exhausted, worn out or guaranteed to sleep.
- Medical claims.
- Breed-specific guarantees.

Preferred wording:

- “The walk matches the dog.”
- “Personalised solo walks.”
- “Appropriate pace and distance.”
- “A balance of movement, sniffing, engagement and rest.”
- “More sustained movement” where relevant.

## Blog System

Main blog index:

- `blog.html`

Dog care advice articles:

- `blog/*.html`

Current public blog URLs should be listed in `sitemap.xml`.

Behind The Lead:

- Public founder journal section.
- Index page is `behind-the-lead.html`.
- Article pages sit under `behind-the-lead/`.
- Public Behind The Lead URLs should be listed in `sitemap.xml`.

When adding a public blog post:

- Create HTML page under `blog/`.
- Add card to `blog.html`.
- Add article metadata.
- Add `BlogPosting` schema.
- Add FAQ schema if there is an FAQ.
- Add internal links to services, Flex Credits, area pages and related blog posts where natural.
- Add URL to `sitemap.xml`.
- Use `https://www.wagandwalk.uk/blog/slug.html` canonical.

When adding a Behind The Lead post:

- Create under `behind-the-lead/`.
- Add to `behind-the-lead.html`.
- Add to `sitemap.xml` if it should be public.
- Use `https://www.wagandwalk.uk/behind-the-lead/slug.html` canonical.
- Use `index, follow` only when the post is ready to publish.

### Google Preferred Sources

`js/preferred-sources.js` is the shared static-site component for Google's official Preferred Sources control. `js/main.js` loads it only on the blog index, Behind The Lead index and individual pages under `/blog/` or `/behind-the-lead/`. It creates one secondary card before the existing contact strip, then loads Google's official script asynchronously.

Do not manually paste Google's script or button markup into an article. New public editorial pages under those paths inherit the component automatically. Do not add it to commercial pages such as home, services, area pages, prices, contact, onboarding or booking journeys.

The control tracks a `preferred_source_interaction` only when the visitor has consented to analytics. It records a click on the embedded control, not a completed Google preference change.

## Reviews

Reviews page:

- `reviews.html`

Current live reviews:

- Jane from Bark.
- Tom from Yell.

The placeholder review was removed. Reviews use visible CTAs to the original review sources.

When adding a review:

- Use real review text only.
- Include source and date if available.
- Add a visible link to the source.
- Do not invent ratings or testimonials.

## DBS Section

DBS section:

- `about.html#dbs-check`
- Styling in `css/dbs-check.css`
- Image: `images/dbs-check-clear.jpeg`

Current DBS status:

- Basic DBS
- Clear
- Latest check issued: 23 June 2026
- Certificate holder: Nathan Lothian

The public screenshot intentionally hides personal certificate details. The button links to the contact form with a prefilled DBS certificate request message.

## Policies

Policies page:

- `policies.html`

Important anchor:

- `#policy-disclaimer`

Policy buttons should generally link to:

```text
/policies.html#policy-disclaimer
```

This ensures users read the disclaimer before the detailed policy sections.

When policies are changed:

- Update the “Last updated” date on the policies page to the date the change is requested.
- Update any matching policy summaries on service or pricing pages.
- Check anchors from services, Flex Credits and client registration.

## Deployment

Deployment target:

- Cloudflare Pages

Files relevant to deployment:

- `_headers`
- `_redirects`
- `.assetsignore`
- `robots.txt`
- `sitemap.xml`

`.assetsignore` excludes non-public files from deployment, including:

- `.git`
- `.wrangler`
- `node_modules`
- `.env`
- `README.md`
- package files

Important: if Cloudflare is running `npx wrangler deploy` and the repo root is used as the asset directory, do not upload a root-level `_worker.js`. Wrangler blocks Pages `_worker.js` files from being uploaded as public static assets.

If adding documentation:

- Docs are useful in the repo, but `.assetsignore` should be reviewed if Cloudflare starts publishing documentation unexpectedly.

## Pre-Deployment Checklist

Run these checks before publishing:

1. Preview locally with `python3 -m http.server`.
2. Click main nav on desktop and mobile.
3. Check homepage, services, prices, Flex Credits, contact and policies pages.
4. Check any edited page on mobile width.
5. Search for old prices or outdated business details.
6. Validate JSON-LD.
7. Confirm canonical tags use `https://www.wagandwalk.uk`.
8. Confirm sitemap includes public pages only.
9. Confirm public Behind The Lead URLs are in sitemap.
10. Check `_redirects` contains relative redirects only.
11. Check `robots.txt` still points to `https://www.wagandwalk.uk/sitemap.xml`.

Useful commands:

```bash
rg -n "https://wagandwalk.uk|http://wagandwalk.uk|/index.html" . --glob "*.html" --glob "*.xml" --glob "*.txt" --glob "*.js"
```

```bash
rg -n "rel=\"canonical\"|og:url" . --glob "*.html"
```

```bash
curl -I http://127.0.0.1:8773/
curl -I http://127.0.0.1:8773/services.html
curl -I http://127.0.0.1:8773/contact.html
```

## Troubleshooting

### Page Shows Unstyled HTML

Likely causes:

- Opened with `file://` instead of local server.
- CSS path failed.
- Browser cached an old stylesheet.

Fix:

- Use local preview URL such as `http://127.0.0.1:8773/`.
- Hard refresh.
- Check stylesheet links.
- Add temporary cache-busting query string if needed.

### Local Preview Port Stops Working

Symptom:

- Browser shows empty response or old page.

Fix:

- Start a fresh local server on a new port.

```bash
python3 -m http.server 8774
```

### Google Reports Alternative Page With Proper Canonical

Check:

- Canonical uses `https://www.wagandwalk.uk`.
- Sitemap uses `https://www.wagandwalk.uk`.
- No `/index.html` canonical.
- Non-www redirects to www.
- No conflicting Cloudflare Page Rules.
- No internal links point to non-www or `/index.html`.

### Too Many Redirects

Likely causes:

- Cloudflare dashboard rules conflict with each other.
- A Page Rule redirects a path back to itself.
- Non-www and www redirects fight each other.
- Clean URL and `.html` redirects conflict.

Fix:

- Keep one canonical direction: non-www to www.
- Do not redirect `www.wagandwalk.uk` back to `wagandwalk.uk`.
- Avoid extensionless to `.html` redirects if Cloudflare clean URLs are active.

### Cloudflare Deployment Fails Because Of `_redirects`

Likely cause:

- `_redirects` contains absolute URLs.

Fix:

- Use only relative redirects in `_redirects`.
- Put non-www to www behaviour in Cloudflare dashboard redirect rules.

### Cloudflare Deployment Fails Because Of `_worker.js`

Likely cause:

- Wrangler is trying to upload `_worker.js` as a public static asset.

Fix:

- Delete `_worker.js` from the repo or ensure it is not uploaded.
- Use the Cloudflare dashboard redirect rule for non-www to www instead.

### Contact Form Does Not Submit

The form posts to `/api/contact`; the Cloudflare Worker validates it and sends a signed request to the Wag & Walk Hub.

Check:

- `data-contact-form` is present and `js/contact-form.js` is loading.
- Cloudflare has `HUB_BASE_URL` and encrypted `WEBSITE_INGESTION_SECRET` configured.
- The deployed Worker is `src/worker.js`, rather than an uploaded root `_worker.js` asset.
- Worker logs and the Hub ingestion endpoint response for the relevant submission.

### Client Registration Form Does Not Open From Shared Link

Check:

- URL hash is `#client-registration-form`.
- `js/registration.js` is loaded.
- The section `id="client-registration-form"` exists.
- The form is not blocked by privacy extensions or Google restrictions.

### Instagram Feed Looks Wrong

Check:

- Mirror App embed URL is correct.
- `js/main.js` is loading.
- `_headers` CSP allows Mirror App and jsDelivr.
- The feed may depend on Mirror App settings outside this repo.

## Future Developer Notes

This site has grown through iterative static edits. Many shared elements such as navigation, footer and schema are repeated manually across pages. That means a site-wide change usually requires updating many HTML files, not a single template.

When doing site-wide edits:

- Use search first.
- Update visible content and schema together.
- Avoid editing unrelated copy.
- Keep Behind The Lead index, article cards and sitemap entries aligned.
- Keep deployment redirects simple.

The safest workflow is:

1. Search.
2. Make small scoped changes.
3. Validate metadata and schema.
4. Preview locally.
5. Update sitemap if needed.
6. Deploy.
