# SEO Audit and Maintenance Notes

Audit date: 30 August 2026

## Canonical URL convention

- Homepage: `https://www.wagandwalk.uk/`
- Public pages: `https://www.wagandwalk.uk/about`
- Area pages: `https://www.wagandwalk.uk/areas/dog-walker-middleton`
- Articles: `https://www.wagandwalk.uk/blog/how-much-exercise-does-a-cockapoo-need`

The canonical host is `www.wagandwalk.uk`; all public HTML filenames remain in the repository, but are not public canonical URLs. The Worker in `src/worker.js` permanently redirects non-www, `/index.html`, `.html` documents and the retired pick-up/drop-off route before serving assets. Preserve this rule when adding routes.

## Findings and actions

### Critical: conflicting URL signals

Production had been serving extensionless page URLs while the sitemap, canonical tags, Open Graph URLs and internal links used `.html` URLs. This caused search engines to receive redirecting URLs as canonical signals. All public source links, canonical URLs, structured-data `mainEntityOfPage` values and sitemap URLs now use the extensionless convention.

### High: non-www host did not redirect consistently

The Worker now makes `wagandwalk.uk` redirect to `https://www.wagandwalk.uk` in one permanent redirect while retaining the full path and query string. Do not add a competing Cloudflare Page Rule that redirects `www` back to non-www.

### High: retired service could remain discoverable

`/pickup-dropoff` and `/pickup-dropoff.html` now permanently redirect to `/services`, and the page is excluded from `sitemap.xml`.

### Medium: area-page metadata quality

The highest-priority Middleton and Rochdale pages now have clearer, conversion-led descriptions. Generic area descriptions that referred to “nearby Middleton areas” have been replaced with area-specific solo-walk descriptions. The Alkrington page was also improved because it is already close to page one.

### Medium: article CTR and markup

Cockapoo and Labrador exercise articles now lead with a more specific title/description, retain the original useful advice, have clearer conversion paths and include `BreadcrumbList` data. Malformed nested paragraphs across the advice articles were corrected.

### Low: performance and mobile

Hero images retain explicit dimensions. Duplicate, below-the-fold area-page images now lazy-load. The externally hosted Instagram embed is the most likely optional performance cost; leave it in place unless future field data shows it harming Core Web Vitals.

## Content and internal-link principles

- The commercial journey is: service need -> solo walking -> pricing or Flex Credits -> area availability -> contact/meet and greet.
- Keep internal links descriptive and contextual. Do not add large repeated keyword link blocks.
- Do not create pages for Heywood, Oldham or Bury until service coverage is confirmed and sufficient unique, factual local content exists.
- Preserve the distinction between reactive and aggressive dogs. Reactive can mean anxious, overstimulated or trigger-sensitive; it must not be presented as aggression.
- Keep solo-walk wording accurate: unrelated client dogs are not mixed; dogs from the same household can walk together.

## Structured data

Existing LocalBusiness, FAQPage and BlogPosting markup remains in place. Breadcrumb data is now present on the highest-priority local and advice pages. Every new commercial area page should have a self-referencing canonical, LocalBusiness/FAQ data only where supported by visible content, and a BreadcrumbList if it has a breadcrumb trail.

Never add aggregate ratings, review counts, opening hours, locations or service claims that cannot be substantiated on the page and in the business operation.

## Sitemap and robots

- `sitemap.xml` contains canonical HTTPS `www` URLs only.
- `robots.txt` allows crawling and points to `https://www.wagandwalk.uk/sitemap.xml`.
- Do not add private, draft or operational pages to the sitemap merely because they exist in the repository.

## Priority backlog (do not publish automatically)

### P1

1. A single, carefully written guide on whether reactive dogs can use a dog walker, only once handling limits and suitability criteria are agreed.
2. Improve Rochdale coverage only after confirming which postcodes and regular windows are genuinely viable.
3. Obtain more genuine Google Business Profile reviews that describe the service, area and outcome in the customer’s own words.

### P2

1. A practical “30-minute walk: when is it enough?” article.
2. A key-handling explainer that links to the existing policy and meet-and-greet process.
3. Add BreadcrumbList markup to remaining area and article pages when those pages receive their next content update.

### P3

1. Add a dedicated original image for high-impression breed articles rather than reusing the social image.
2. Revisit Manchester intent after primary Middleton/Rochdale pages show improvement; do not expand broad-city targeting without capacity evidence.

## Post-deployment checks

1. Test `https://wagandwalk.uk/about` and `https://www.wagandwalk.uk/about.html`; both should end at `https://www.wagandwalk.uk/about` with a single 301 response from the site configuration.
2. Inspect the live sitemap in Google Search Console and resubmit it once.
3. Request indexing only for the materially improved Middleton, Rochdale, Cockapoo and Labrador pages; do not request every URL in bulk.
4. Monitor the next 28 and 90 days for impressions, clicks, CTR and average position for `dog walker Middleton`, `dog walking Middleton`, `dog walker Rochdale`, `dog walking Rochdale`, `solo dog walker`, `one-to-one dog walking`, `reactive dog walker`, Cockapoo exercise and Labrador exercise queries.
