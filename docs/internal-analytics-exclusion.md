# First-party internal analytics exclusion (pre-deployment preparation)

Goal: Chrissy can visit `https://www.enslain.net/?internal=1` once in each ordinary browser (iPhone Safari, laptop browser) to exclude her own future GA4 page views and SumUp outbound-click events. `?internal=0` restores tracking.

## Integration requirements
- Existing GA4 / Google Tag Manager initialization must be found and gated **before** any analytics script runs, including scripts inserted by Netlify/third-party tooling. The current static HTML head in `public/index.html` contains no visible GTM bootstrap. Do not merely add a late click handler.
- Read a same-origin browser flag in localStorage at the earliest shared bootstrap point. On `internal=1`, set it and immediately remove the query parameter with history.replaceState (preserving all other parameters/hash). On `internal=0`, clear it. Exclude only the current browser profile.
- While internal, suppress GA4 initialization and GA4 outbound-link tracking; preserve all functional, non-analytics website scripts. If GTM is used for non-analytics functions, gate only analytics tags instead of disabling all GTM.
- Ensure the website's future event page rebuilds retain the mechanism; use the site generation/template system instead of hand-editing every generated HTML file.
- Account for existing GA4 IP-based Internal Traffic filter; no need to remove it.
- QA: same-browser refresh and navigating pages; same-origin URL without query; other browsers remain tracked; internal=0 restores tracking; click events to shop.enslain.net remain tracked for normal visitors; Safari private browsing isn't persistent; inspect network requests, GA4 Realtime and DebugView.
- Caveat: localStorage is browser/profile scoped and cleared with site data; this is not device-wide and cannot guarantee exclusion from other browsers or the hosted SumUp webshop. A publicly discoverable toggle isn't secure authentication but only affects the browser that visits it.
- Don't merge or deploy until the actual GTM insertion point has been located and tests are passing.

This branch intentionally contains preparation only; no live analytics behavior is changed yet.
