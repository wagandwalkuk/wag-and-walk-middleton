# Wag & Walk Middleton Website

Static HTML website for Wag & Walk Middleton, ready for Cloudflare Pages.

## Before making changes

Read `docs/DEVELOPER_HANDOFF.md` before editing the site.

That guide explains the file structure, SEO rules, redirects, pricing references, forms, policies, blog setup, common troubleshooting checks and deployment notes for future maintainers.

## Cloudflare redirects

The `_redirects` file only contains relative static asset redirects, for example `/index.html / 301`.

Do not add non-www to www domain redirects to `_redirects`. Cloudflare static asset redirects can reject absolute URL rules in this context.

Handle the non-www to www redirect in the Cloudflare dashboard using a Redirect Rule:

- Source hostname: `wagandwalk.uk`
- Target: `https://www.wagandwalk.uk/${uri.path}`
- Status code: `301`

## Deployment files

Non-public files such as `.git`, `.wrangler`, `node_modules`, environment files and local project metadata are excluded via `.assetsignore`.

Do not upload a root-level `_worker.js` file with the static site. Wrangler blocks Pages `_worker.js` files from being uploaded as public assets. Non-www to www redirects should be handled in the Cloudflare dashboard instead.


## Control Centre lead ingestion

The contact form posts to the local Cloudflare Worker route `/api/contact`.
The Worker validates the form, signs the request server-side and forwards it to the private Wag & Walk Control Centre lead ingestion endpoint.

Required Cloudflare Worker secrets:

- `CONTROL_CENTRE_LEAD_ENDPOINT`
- `WEBSITE_INGESTION_SECRET`

Do not put `WEBSITE_INGESTION_SECRET` in browser JavaScript or public HTML.
