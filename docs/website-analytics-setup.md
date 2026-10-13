# Enslain website analytics (preview scaffold)

This branch prepares **Google Analytics 4** and **Cloudflare Web Analytics** with no changes to website appearance. Both measurement identifiers are intentionally blank until the accounts are created. The shared `/assets/script-min.js` runs on existing normal, artist, festival and tour pages. Redirect-only `/events/past-events/` is excluded.

## Chrissy's setup steps
1. **Google Analytics 4:** go to https://analytics.google.com/, create property **Enslain Metal Merch** (Finland; Euro) and web stream for **https://www.enslain.net/**. Copy the **G-…** Measurement ID.
2. **Cloudflare Web Analytics:** go to https://dash.cloudflare.com/ → Web Analytics → Add site. Enter **enslain.net** (no Cloudflare DNS/proxy move). Copy the site's **32-character token** from Manage site / JS snippet.
3. **Google Search Console:** go to https://search.google.com/search-console/ and add a **URL-prefix** property **https://www.enslain.net/**. Choose **HTML tag** verification; copy the `google-site-verification` token. This avoids touching existing DNS.
4. Send all three values to Chadley, who will configure the GitHub preview, insert the Search Console verification meta in the homepage and matching Kit header template, verify, then request approval before merging to master.

## Implementation
- Active source: `src/js/analytics.js`; registered in `src/js/script.js` for the existing CodeKit build.
- Live-served compiled bundle: `public/assets/script-min.js`, with the same bootstrap added as an independent, self-contained script. Keep both copies synchronized.
- Google tag loads **only** when the G- ID is set; Cloudflare beacon loads **only** when the token is set. No false tracking until configured.
- Runs only on `enslain.net` / `www.enslain.net`, not on `deploy-preview-*.netlify.app`. No code changes to the SumUp shop.
- GA4 custom click events: `contact_click` on email links, `webshop_click` on outbound shop links. GA4's Enhanced Measurement can separately report other outbound clicks.
- Search Console does not require a visitor-facing site script.
- This scaffold adds **no popup or banner**. Standard GA4 without prior consent is not compliant with relevant Finnish/EEA consent requirements and can conflict with Google's EU User Consent Policy; the site owner has explicitly chosen a no-banner visitor experience.

## Test when identifiers are inserted
- Check emitted code on normal and Roadbook-generated pages.
- In GA4 Realtime, visit https://www.enslain.net/ and visit internal pages; verify a `page_view` event and click events.
- Check Cloudflare Web Analytics visits and page URL reporting (allow a short delay).
- Complete Search Console HTML-tag verification and submit `sitemap.xml` after one actually exists.
- Confirm the existing Facebook/Instagram widgets, footer credit, Enslain color themes and event filtering remain unchanged.
