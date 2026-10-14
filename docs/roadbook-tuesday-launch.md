# Roadbook Tuesday publisher — Monday/Tuesday release preparation (14 Oct 2026)

**Not enabled.** This branch has no automatic sync, production publish, build hook, secrets, or Roadbook edits. Existing older PR #3 must NOT be merged wholesale: it renders old layout, resets SEO titles, splits tours into Upcoming/Past, and uses obsolete nightly automation.

## Contract / newest decisions
- Sunday 05:00 lineup research updates Roadbook; Tuesday publishes approved changes. Research itself must not deploy.
- Read live **Events** and **Website Feed** privately, via Sheets read-only scope. Publish only matching stable IDs with Events Status=Confirmed, Public?=Yes and Website Feed Publish=Yes. Fail closed on mismatch, duplicate, missing data or unavailable Google API. Never leak seller, assignment, internal notes, Tour / Series, private flags, or unannounced gigs.
- Preserve PR #11 public site appearance, 05:00 Europe/Helsinki upcoming-to-past rollover on Events and 15 artist pages, chronological one-table tour pages (with past ticket expiry), SEO/canonicals/sitemap, themes, analytics, and homepage's manually featured four gigs. Preserve source/compiled asset parity.
- Dedicated festival pages refresh **only on Tuesdays when** a public lineup/date/venue/cancellation fact changed or an edition ended. No daily festival-page clock.
- Next tour refresh MUST place EV-2026-0138, ZRock Christmas Special 6 Nov 2026 at Zemppi Areena, Kempele, into the *existing* Brymir 2026 tour as 13th date. Do not rename the source event or infer other tour membership from event names.
- Regenerate all affected dependent pages plus SEO together from one consistent snapshot. A canceled or withdrawn gig MUST disappear from every public static page/source/metadata, not merely from JavaScript's visible list.
- Deterministic output comparison: no changed public material => **no commit and no Netlify production deploy**. Private-only edits never trigger deploys. Do not overwrite unrelated static pages.
- One production deploy at most per changed Tuesday publication. Urgent user-triggered manual publishing uses the identical validation and no-op gate.

## Preflight test
Run `node scripts/check-roadbook-publish.mjs public` on the current baseline (no Kempele requirement). Run `ROADBOOK_REQUIRE_KEMPELE=1 node scripts/check-roadbook-publish.mjs public` **on the generated Monday candidate**, requiring the queued tour fix. This gate checks public-page registry, no collapsed Events, no deleted Battle Beast 15 Nov gig, scripts, SEO, festival no-daily policy, and simplified tours. It is **necessary but not sufficient**: private source/public ID parity and test fixtures still require a generator.

## Monday 19 Oct — gates before turning on Tuesday schedule
1. Implement current-master-compatible renderer, on a separate PR/Netlify preview, without importing stale generated pages from PR #3.
2. Run private read-only Roadbook full audit (Events and Feed), verify safe IDs and every public field. Simulate new confirmed gig, new unannounced/private gig, cancellation/delete, lineup change, seller-only edit, API outage, multiday festival completion, year/DST boundary.
3. Ensure the generator handles all existing 15 artists, 9 festivals, three tour detail pages, directories, sitemap and raw HTML privacy, plus Brymir Kempele. Assess 22 Roadbook tour registry entries without fabricating pages.
4. Run this static gate on GENERATED output, compare diff against current master, validate no HTML theme/analytics/SEO regression and one no-op second run. Do not activate based only on unit tests.
5. Install private read-only service account in GitHub encrypted Actions secrets (or workload identity). Do not paste JSON keys into chat, commits or files. Verify Netlify account remaining credits/settings in dashboard.
6. Enable Tuesday trigger only after a manual dry-run and a controlled GitHub→Netlify production test. GitHub Actions schedules use UTC; use paired UTC hours and Helsinki clock guard for DST or a documented fixed UTC compromise. Monitor public-repo schedule inactivity disabling after 60 days. Manual run must be available.
7. Log source snapshot hash, decision summary, generated-public hash, changed file list and exact production commit; do not emit private rows or credentials. Abort safely on any mismatch. Preserve previous published site on failure.

## Tuesday 20 Oct — observe
- Confirm exactly one scheduled run at expected Helsinki time, with clear pass/fail status and changed/no-op conclusion.
- Verify Roadbook snapshot, publishable IDs, full static withdrawals, public artist/festival/tour dependencies, Kempele tour, canonical and sitemap; check the production site rather than trusting a preview.
- Run again with identical inputs; verify zero commit and zero Netlify production deploy. If failure, preserve last good deploy, diagnose, repair, and run manually.

## Unresolved hard blockers (not hidden)
- Current-main-compatible renderer, safe full private Sheets-fetch workflow, read-only credentials and scheduled publishing have not yet been implemented.
- Direct Netlify account billing/configuration access is unavailable through this connection. Production deployment cost must be checked there.
- The old PR #3 is obsolete and unsafe to activate unmodified.
