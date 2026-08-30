# Website Analytics

Last reviewed: 30 August 2026

This guide explains the Google Analytics 4 (GA4) implementation for Wag & Walk Middleton. Read it before changing the Cloudflare Worker, the contact form, website footer, `js/analytics.js` or the Content Security Policy in `_headers`.

## How It Works

The website uses a direct Google Analytics 4 implementation. It does not use Google Tag Manager.

Analytics are optional. The Google tag is not loaded until a visitor chooses **Accept analytics** in the cookie banner. Until then, the website operates normally and no GA4 page views or events are sent.

The browser script is `js/analytics.js`. The Cloudflare Worker injects it into public Wag & Walk HTML pages. It does not inject it into the separate `/web/` site.

GA4 is enabled only when the Cloudflare Worker has a valid environment variable:

```text
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

The measurement ID is not a secret, but it is deliberately not hard-coded into the public HTML. If the variable is absent or invalid, the analytics script exits safely and the site remains unaffected.

## Consent Behaviour

- New visitors see the optional analytics cookie banner.
- **Accept analytics** grants `analytics_storage` only.
- **Reject optional cookies** keeps analytics disabled.
- `ad_storage`, `ad_user_data` and `ad_personalization` remain denied in every state.
- **Cookie Settings** is added to the public-site footer so a visitor can change their choice later.
- Withdrawing consent sends a denied Consent Mode update and removes first-party GA cookies that the browser can clear.
- The stored browser preference is `wagwalk_cookie_consent` in local storage.

The policies page contains the visitor-facing explanation at `/policies.html#privacy-cookies`.

## Events

The following events are sent only after analytics consent has been granted:

| Event | When it is sent | Parameters intentionally included |
| --- | --- | --- |
| `page_view` | A public page is loaded | `page_location`, `page_path`, `page_title` |
| `generate_lead` | The contact form has received a successful response from `/api/contact` | `enquiry_type`, `service_type`, `form_location` |
| `begin_booking` | A visitor selects a meet-and-greet / booking CTA leading to the contact page | `link_location`, `cta_label`, `booking_type` |
| `contact_phone` | A `tel:` link is selected | `link_location`, `cta_label` |
| `contact_email` | A `mailto:` link is selected | `link_location`, `cta_label` |
| `contact_whatsapp` | A WhatsApp link is selected | `link_location`, `cta_label` |

Do not add names, email addresses, telephone numbers, postcodes, dog names, free-text messages or any other personally identifiable information to GA4 parameters. The contact form event is deliberately triggered only after the Worker accepts the request, not on form submit.

## Local Development

Analytics are disabled on `localhost`, `127.0.0.1` and `::1` by default. This protects the live GA4 property from ordinary local testing.

For a deliberate debug session only, add `?analytics_debug=1` to a local URL after a valid measurement ID has been configured. The script includes GA4 `debug_mode` for that session.

Never use real customer contact details while testing analytics.

## Cloudflare Configuration

In the Cloudflare dashboard, open the `wag-and-walk-middleton-website` Worker / Pages project and add a plain-text environment variable named `GA4_MEASUREMENT_ID` with the GA4 web data-stream Measurement ID, for example `G-ABC1234567`.

Add it to **Production**. Add it to Preview too only if you deliberately want GA4 testing on preview deployments. Do not add it to `wrangler.jsonc`, HTML files or browser JavaScript.

The Worker exposes `/api/analytics-config`. It returns:

```json
{"enabled":true,"measurementId":"G-ABC1234567"}
```

only when a valid variable is present. It returns disabled otherwise. The endpoint uses `Cache-Control: no-store` so configuration changes are not cached by the browser.

## Content Security Policy

`_headers` permits the Google tag and GA4 collection endpoints:

- `https://www.googletagmanager.com` in `script-src`
- `https://www.google-analytics.com` and `https://region1.google-analytics.com` in `connect-src`

If analytics fails after a future CSP edit, check these domains first.

## Verification Checklist

After configuring the measurement ID and deploying:

1. Open the live homepage in a private / incognito browser window.
2. Confirm the consent banner appears.
3. Choose **Reject optional cookies**. In browser developer tools, confirm no request is made to `googletagmanager.com` or `google-analytics.com`.
4. Open **Cookie Settings**, choose **Accept analytics**, then refresh once.
5. In GA4, open **Reports > Realtime** or **Admin > DebugView** and confirm a page view appears.
6. Select a booking CTA, a telephone link and the WhatsApp button. Confirm the matching events appear in DebugView.
7. Send a test contact request using non-personal test data. Confirm `generate_lead` appears only after the success message is shown.
8. In GA4, mark `generate_lead` as a key event. Do not mark `begin_booking` as a key event unless the business decides that click intent should count as a conversion.

GA4 reporting can take time to populate outside Realtime and DebugView.

## Troubleshooting

### No cookie banner

Check that the requested page is a public Wag & Walk HTML page, not a `/web/` page. Then check the Worker is active and that its response contains:

```html
<script src="/js/analytics.js" defer></script>
```

### Banner appears but GA4 never receives data

Check the visitor has accepted analytics and visit `/api/analytics-config`. It should return `enabled: true` and the expected `G-` ID. Then check that `_headers` still allows the Google domains listed above.

### `generate_lead` is missing

The event is only sent after `/api/contact` returns success. Check the form status message and the Worker / Hub configuration before changing the analytics script.

### Duplicate page views or events

Do not add another Google tag, GA4 plugin, Google Tag Manager container or inline `gtag()` calls to the pages. The Worker injection and `js/analytics.js` are the single source of truth.

### Visitor wants to change their choice

Use the footer **Cookie Settings** control. It reopens the consent dialog and updates the stored choice.
