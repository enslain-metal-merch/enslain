# Roadbook public feed — Stage 1 audit and safety contract (2026-10-14)

**Status: TEST-ONLY. No scheduled jobs, credentials, Netlify functions, data publication, or changes to visitor-facing files are included in this PR.**

## Actual repository and deployment audit
- The production branch is master, published by the Enslain Netlify site using committed public/ assets.
- No netlify.toml, package.json, GitHub Actions, or Netlify scheduled function exists on master as of 2026-10-14.
- Current public/events/index.html contains a static Roadbook-derived archive (~687 KB); source template src/kit/events.kit and public/assets/events.js filter existing HTML rows, not remote JSON.
- The live Roadbook has Events and a hidden Website Feed. The source is *not* public-only; the Publish field alone does not authorize publication.
- Draft PR #3 contains a broader full HTML generator and a Netlify scheduled function that POSTs a build hook at 03:00 Helsinki regardless of whether public content changed. It is **not safe to activate or merge wholesale**.
- PR #7 independently published current Clients/Artists/Festivals/Touring History; PR #9 subsequently updated existing live SEO and sitemap. PR #3 is older than current master.
- Production Netlify UI settings (actual plan usage, current build command, deploy hooks, access controls, and branch deploy configuration) could not be inspected through connected tools; must be confirmed in Netlify before automation is enabled.

## Cost and publication architecture proposal (not yet activated)
1. Daily, read-only Roadbook check in GitHub Actions. Reuse the tested public projection in this directory and a *read-only* Google service account secret. No credentials in HTML, JSON, source, or commit logs.
2. Compare canonical JSON to the last published copy. Publish **only on byte-level meaningful changes** to a GitHub Pages feed (ideally an isolated data repository or a dedicated pages branch that is NOT the Netlify production branch). Never push normal data updates to master or trigger a Netlify build hook.
3. Update the existing Events UI to consume the published feed, preserving filters, theme, upcoming/past lists, ticket behavior, and old-data fallback after explicit review. Publish only preauthorized public fields. A last-good fallback helps with network outages, but MUST NOT resurrect withdrawn gigs.
4. Preserve canonical page URLs and server-rendered SEO: use a separately capped, deliberate static-HTML refresh schedule (e.g. twice monthly) plus an urgent withdrawal procedure. Google indexing cannot automatically see new client-rendered data as reliably as static HTML; this is an explicit tradeoff, not an SEO guarantee. A canceled event already baked into old HTML requires a targeted production redeploy to remove it from source/SEO, even if a live JSON feed hides it from interactive users.
5. Before activation, verify website build settings and current credits from the owner's Netlify dashboard, GitHub Pages hosting settings, Google read-only credentials, change notifications, accessibility, cross-origin loading, fallback withdrawal rules, cache headers, and launch/rollback tests.
6. GitHub may automatically disable scheduled workflows after 60 days without repository activity. Monitor the scheduler and provide a manual run option. Do not assume a schedule alone is permanent.

## Stage 1 public JSON safety contract
Only include a record if Events.Status == "Confirmed", Events.Public? == "Yes", AND Website Feed.Publish == "Yes". Match public values across both tabs; any mismatch or invalid dates aborts without writing. Stable EV-YYYY-NNNN IDs and deduplication are mandatory.

Whitelist output fields only: stable ID, start/end dates, human date, public event, venue, city, country, public Details, public Search Bands, and upcoming ticket URL. Never export seller, payment, client/assignment records, internal Tour/Series, internal notes, or unpublished Event IDs. Historical ticket links stay only in Roadbook. No timestamp in output: unchanged data must produce unchanged bytes. Atomic write occurs only after full validation and only if the content has changed.

The "Exclude from Finnish Metal Gigs?" field is reserved for the separate future discovery project. It must NOT hide otherwise public Enslain gigs from the existing /events/ page.

Next proof point: test source against a **sanitized snapshot** of the live sheet, compare approved counts and exclusion cases (including EV-2026-0146), without writing to production or exposing private rows. Only then add a read-only Sheets fetch in a separate PR.
