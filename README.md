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


## Hub meet-and-greet request ingestion

The contact form posts to the local Cloudflare Worker route `/api/contact`.
The Worker validates the form, signs the request server-side and forwards it to the Wag & Walk Hub lead ingestion endpoint:

```text
POST {HUB_BASE_URL}/api/integrations/website/leads
```

The website only sends a meet-and-greet request. It does not book the meet and greet automatically.

Required Cloudflare Worker environment variables:

- `HUB_BASE_URL=https://hub.wagandwalk.uk`
- `WEBSITE_INGESTION_SECRET`

`WEBSITE_INGESTION_SECRET` must be stored as an encrypted secret variable in Cloudflare, using the same value configured in the Hub.

Do not put `WEBSITE_INGESTION_SECRET` in browser JavaScript or public HTML.
