# Enslain website analytics — activation checklist

## Current branch status (2026-10-13)
- GA4 Measurement ID: `G-MF9VNNQ7ZW` — configured in source and published bundle.
- Cloudflare Web Analytics token: `0df2800b2b92473499a18e2542797e66` — configured in source and published bundle.
- Google Search Console verification: **pending**.
- Production: **not yet enabled**. This is draft PR #8, not merged into `master`.
- Netlify deploy preview: https://deploy-preview-8--enslain.netlify.app/ (analytics deliberately disabled on Netlify hostnames).

## Next: Google Search Console
1. Open https://search.google.com/search-console/
2. Add **URL-prefix** property `https://www.enslain.net/` (NOT Domain property, which would require DNS verification).
3. Select **HTML tag** verification and copy the complete meta tag `<meta name="google-site-verification" content="...">`.
4. Provide the tag to Chadley to insert into `public/index.html` and the shared Kit header source `src/kit/partials/_header.kit` on this branch.
5. Merge only after user review, then return to Search Console and press **Verify** against live www.enslain.net.

## Technical behavior
- `src/js/analytics.js` is the editable source registered in `src/js/script.js`.
- `public/assets/script-min.js` is the compiled file actually served by Netlify; update BOTH with changes.
- Browser loads GA4 and Cloudflare only for `enslain.net` / `www.enslain.net`, not deploy previews or shop subdomains.
- GA4 sends normal automatic page views plus explicit email `contact_click` and shop `webshop_click` click events. These are click intent, not confirmed inquiries or purchases.
- Cloudflare Web Analytics collects its standard page-view/site metrics.
- Google Search Console verification adds no visitor-facing script.
- Existing social integrations and the visual appearance remain unchanged.
- No popup or banner is added. Standard GA4 without consent is not compliant with relevant Finnish/EEA consent requirements and may conflict with Google's EU User Consent Policy, as explained to the user.

## Post-publish checks
- Verify deployed code contains both tokens and the Search Console meta tag on the *actual* live domain.
- Visit `https://www.enslain.net/`, follow several page links, and check GA4 Realtime / Cloudflare analytics after their reporting delays.
- Test email and outbound webshop link GA4 events; avoid interpreting clicks as completed transactions.
- Confirm `/events/`, `/clients/`, sample artist/festival detail pages, and all Enslain appearance themes behave as before.
- Verify Search Console property only after meta tag is deployed to production; submit sitemap once the site actually has one.
