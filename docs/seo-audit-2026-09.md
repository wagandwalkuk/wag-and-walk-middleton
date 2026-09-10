# Targeted SEO and indexing audit

Audit date: 10 September 2026. Baseline: `a0c0507`; canonical migration `54f8595` inspected and retained.

## 1. Indexing diagnosis

The supplied counts are consistent with consolidation following the URL migration. They do not prove that every exclusion is healthy. Live checks found 46 sitemap URLs returning 200 with matching self-canonicals and Open Graph URLs, no noindex directives or conflicting canonical headers. None is orphaned; commercial pages are one link from the homepage, articles at most two in the static link graph (pagination can affect visible clicks).

| Classification | Verified URL or limitation |
| --- | --- |
| A: intentional exclusion | `/pickup-dropoff` retired, excluded from sitemap, redirects to `/services`. Documentation and server source are excluded from assets. |
| B: legacy redirect | Tested HTTP/non-www/`.html` variants, including `/about.html`, `/index.html` and `/pickup-dropoff.html`. Preserve permanent redirects. |
| C: canonical alternative | `/how-to-choose-a-dog-walker-in-middleton` returns 200 and declares `/blog/how-to-choose-a-dog-walker-in-middleton` as canonical. The latter is 200, self-canonical and in the sitemap. Preserve this established alternative. |
| D: technical error | HTTP www clean URLs could return 200. Trailing-slash document URLs used a temporary redirect and could require a second hop after host canonicalisation. One link targeted missing `/blog#article-types`. |
| E: important unindexed | Cannot assign any particular URL without the Search Console URL-level report. All priority pages pass public indexability checks. |
| F: low-value pages | No new exclusion imposed. Existing utility/onboarding page policy preserved. `/web/` is a separate microsite, not part of the dog-care sitemap. |
| G: unknown | Exact five redirect errors, one Google-selected canonical disagreement, seven discovered/not-indexed and one crawled/not-indexed URLs were not supplied and cannot be inferred from counts or public fetching. |

The email therefore appears substantially migration-related, with two verified remaining redirect weaknesses addressed here. It is not evidence that all 75 excluded URLs should be indexed. This audit cannot establish whether our verified problems are the exact five errors in Search Console or whether Google's stored reports predate fixes. Indexability is not proof of indexing.

## 2. Technical fixes

- `src/worker.js`: extend the existing canonical function to redirect HTTP www requests to HTTPS. Normalise trailing slashes for public document routes before composing the destination; combine host, scheme, path and retired-route changes in one 301, preserving query strings. Asset directories, API paths and local preview hosts retain their routing. No changes to `run_worker_first`, clean URL architecture, canonical tags or working retirement rules.
- `behind-the-lead.html`: fix `/blog#article-types` to the existing `/blog#articles` target.
- Cockapoo/Labrador articles: remove redundant paragraph closing tags left by earlier paragraph cleanup. No advice rewritten.
- README/handoff: correct stale `.html` canonical and Cloudflare Pages/domain-rule instructions so future edits preserve the deployed Worker setup.

## 3. Middleton optimisation

Homepage title, H1, pricing and service positioning already match the priority intent and were retained. Replace the primary onboarding CTA with a meet-and-greet request link to `/contact`, appropriate for new search visitors.

Existing Middleton page: replace the awkward exact-match subheading and generic introduction with Nathan's introduction, a descriptive solo-service link and the actual introduction/reporting process. Add current recurring starting prices, drop-in price, customer-review link and a direct postcode/availability enquiry link. Existing local route detail, metadata and trust claims remain.

## 4. Rochdale optimisation

Add practical guidance on planning walks from the Middleton base, postcode, preferred days, changing rotas and walk duration. Include actual recurring prices, review/price/enquiry links and a contextual Middleton link. Coverage remains conditional on address, travel and diary; no new postcodes, promises or invented local routes. Existing title and description already align with the evidenced queries and were retained.

## 5. Pricing optimisation

`/prices` now has the H1 “Dog Walking Prices in Middleton” and a “How much does a dog walker cost?” section beside the existing price table. Explain duration, solo/group comparison, recurring versus other bookings, same-household additional pets and travel/availability checks. The description and social descriptions now show actual recurring starting prices and the drop-in price.

Rates unchanged: recurring 30/60 minutes £11/£16 (+£4 additional pet); regular £12/£18 (+£5); drop-ins £11. Flex pricing unchanged. No market-average price claims, invented travel fees, second pricing page or additional FAQ schema.

## 6. Informational CTR optimisation

Cockapoo and Labrador title tags/descriptions were improved on 30 August and already accurately cover daily needs and life stages. Retain these recent changes for measurement. The missed-walk article's question-led title also matches intent; retain it. No actual CTR gain can be claimed yet.

Improve only contextual commercial links: Cockapoo to Middleton, Labrador to Middleton/Rochdale, missed-walk article to local coverage/prices. Keep all existing advice. Shorten the near-me commercial page title from its long location list to “Local Dog Walker Near Middleton | Wag & Walk”; social titles agree. Its existing postcode-led coverage content needs no rewrite.

## 7. Internal linking

New paths: homepage -> enquiry; breed guides -> Middleton/Rochdale; missed-walk guide -> coverage/prices; pricing -> solo services/Middleton/Rochdale/contact; Middleton/Rochdale -> reviews/prices/contact. No added sitewide keyword blocks. `/services` remains the solo-walking commercial destination; no overlapping solo page created. No Manchester expansion or Walk Hub keyword targeting.

## 8. Canonical and redirect validation

Before: HTTP www `/about` returned 200; www `/about/` returned 307 to `/about`; non-www `/about/` required a host redirect followed by that path redirect. Other sampled legacy formats already worked.

Expected after deployment: each combination of HTTP/HTTPS and www/non-www for `/about.html`, `/about/`, `/index.html` and `/pickup-dropoff.html` gives one 301 to its HTTPS www clean destination, then 200. The already canonical `/about` returns 200. The automated matrix includes query-string preservation and verifies the final route does not redirect again. Production results are recorded below after release.

## 9. Sitemap and indexability

46 unique sitemap URLs. All returned 200, self-canonical and matching og:url before deployment. No redirects, `.html`, non-www, retired pickup service or duplicate canonical variants in the sitemap. No missing internal page targets, broken anchors or orphan sitemap pages remain after the link fix. Robots allows public crawling and advertises the correct sitemap. No sitemap URL changes were required, so no artificial lastmod churn or submission is needed.

53 JSON-LD blocks parsed across 48 main-site HTML files, including the two intentional non-sitemap alternatives. Checked canonical-domain URL fields have no conflicting legacy variants. All 25 LocalBusiness occurrences agree on name “Wag & Walk Middleton” and phone `07343058095`. Contact page reports weekday 08:00–18:00, Saturday 09:00–14:00, Sunday by arrangement. No new hours, street address, rating or review schema added. The supplied five Google reviews/5.0 score is user-reported, not independently verified; authenticated GBP fields are unavailable. Public site identity is consistent, but a full GBP edit-screen comparison cannot be claimed.

## 10. Files changed

- `src/worker.js`
- `index.html`
- `areas/dog-walker-middleton.html`
- `areas/dog-walker-rochdale.html`
- `prices.html`
- `dog-walker-near-me.html`
- `behind-the-lead.html`
- `blog/how-much-exercise-does-a-cockapoo-need.html`
- `blog/how-much-exercise-does-a-labrador-need.html`
- `blog/what-happens-if-you-dont-walk-your-dog.html`
- `README.md`
- `docs/DEVELOPER_HANDOFF.md`
- `docs/audit_seo.py`
- `docs/test_redirects.mjs`
- `docs/seo-audit-2026-09.md`

## 11. Validation

- Deployment bundle: `npx --yes wrangler deploy --dry-run` passed.
- Routing: `node docs/test_redirects.mjs` passed 36 cases, including API routing and local-preview exceptions.
- Source: Worker JavaScript syntax and `git diff --check` passed. No repository package/build/lint suite exists; do not imply one ran.
- `python3 docs/audit_seo.py`: sitemap XML, HTML metadata, JSON-LD parsing, internal targets/anchors and link depth passed. This is targeted structural checking, not a complete W3C HTML conformance certification.
- `python3 docs/audit_seo.py --live`: checks each live sitemap page and representative variant responses. It performs read-only public GET requests, never form submissions.
- Browser checks: seven changed content pages at 390px and 1440px passed, with no horizontal overflow, broken loaded images or uncaught page JavaScript errors. Pricing screenshots inspected. The local Wrangler watcher repeatedly reloaded, so layout checks used a plain static server with clean-path support; Worker routing was tested separately. This is not a test of external Google/Mirror services or an actual contact submission.
- Release: content/code commit `005abb8` pushed to `main`. Direct `wrangler deploy` completed using the existing configuration after the automatic release had not yet been confirmed. Cloudflare version `06ab7d94-58d4-4fbf-bc68-990f1f187172` serves both production hosts.
- Live verification: all 46 sitemap URLs returned 200 with correct self-canonical and Open Graph URLs, no conflicting Link header or X-Robots-Tag, and no source link issues. All 20 representative requests passed: 19 legacy/noncanonical variants returned one 301 directly to the final canonical, and the clean HTTPS www control returned 200. Destinations `/`, `/about` and `/services` are included in the successful sitemap checks.
- All nine modified public pages were fetched and matched the committed HTML byte for byte. A production mobile-browser check of `/prices` confirmed the new cost heading and no uncaught JavaScript errors.

## 12. Manual actions

Only Search Console URL-level details require account information unavailable here. Export the affected URLs for the five redirect errors, canonical disagreement and eight unindexed pages to settle those classifications. Do not request indexing for legacy or canonical-alternative URLs.

After release, prioritise Request indexing for these materially improved canonical pages:

- https://www.wagandwalk.uk/areas/dog-walker-middleton
- https://www.wagandwalk.uk/areas/dog-walker-rochdale
- https://www.wagandwalk.uk/prices

The smaller CTA, title and link changes can be discovered through normal recrawling. Sitemap resubmission is unnecessary because its URL and canonical page set have not changed and it was previously submitted. No Cloudflare dashboard change is required for this Worker fix once production is verified.

## 13. Measurement plan

Record the deployment date and use Search Console country=United Kingdom, search type=Web. Compare like-for-like 28-day windows as data becomes complete; separate devices and brand/non-brand queries where useful.

| When | Compare |
| --- | --- |
| 7 days (17 September) | Live redirect/indexability stability, last crawl and Google-selected canonical for priority URLs, impressions beginning to update. Check exact excluded URLs when available; do not call an early movement a sustained gain. |
| 28 days (8 October) | Clicks, impressions, CTR and average position for dog walker Middleton, dog walking Middleton, dog walker Rochdale, dog walking Rochdale. Compare homepage, Middleton, Rochdale, services, prices and near-me landing pages. Compare Cockapoo/Labrador/missed-walk CTR at similar query/device/position mixes. |
| 90 days (9 December) | Repeat commercial-query and landing-page comparisons, assess sustained progress and qualified local enquiries. Consider seasonality, changed query mix and consent-limited analytics. |

Use accepted form submissions and qualified enquiries where available, plus call/WhatsApp clicks as separate intent signals. A contact click is not a confirmed customer. Aim for relevant enquiries, not raw indexed-page count or a promised rank.

## References

- [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): align redirects, canonicals, sitemap and internal links.
- [Google Search documentation updates](https://developers.google.com/search/updates): the former FAQ documentation redirects here. No new FAQ rich-result eligibility assumption or schema was introduced.
