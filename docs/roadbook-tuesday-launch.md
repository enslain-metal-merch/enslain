# Enslain Roadbook → Website: Tuesday automation launch plan

**Status (Oct 15): keyless federation implementation on draft branch; NOT enabled or released.**
Activation can happen before Monday after all gates pass. First scheduled run
is the next Tuesday after approval. No automatic publishing until then.

## Approved behavior

- Site source of truth: Roadbook Events and hidden Website Feed. Only
  Events.Status=Confirmed AND Events.Public?=Yes AND Feed.Publish=Yes.
  Abort if public fields disagree or an eligible event has vanished from Feed.
- New shows and corrections, removals/cancellations, and approved public
  lineup changes update the compiled Events HTML and every approved artist
  page/directory. No internal seller/client/tour notes are emitted.
- Tour detail pages are **one chronological list**, not Upcoming/Past;
  2026 Brymir, Kaunis Kuolematon with Insomnium, Pat Metheny regenerated
  from stable verified public events. Brymir Kempele ZRock Nov 6 2026
  (EV-2026-0138) is included in the Brymir 2026 tour only, retaining
  its ZRock event name and approved public lineup on Events.
- Artist and main Events Upcoming/Past HTML refreshed on Tuesday; the
  live browser 05:00 Europe/Helsinki clock handles daily changes free.
- Dedicated festival edition pages and festival index updated **only** if
  approved public festival rows have changed or their edition became past.
  Otherwise retain exactly the existing markup. Public editions are regenerated
  inside the existing festival-family page structure when updates are needed.
- Homepage featured gigs remain hand-curated. Never rewrite homepage,
  About/crew, footer credits, CSS, SEO shells, or DNS.
- Write generated content only if different. If no generated public file
  differs, no Git commit/push/Netlify production deployment.
- On invalid data, missing credential or bad source HTML, stop and publish
  NOTHING. Urgent withdrawals require a manually initiated fresh static deploy.

## Activation gates (no shortcuts)

1. Confirm Netlify Free usage/budget and that **only master** deploys
   production. Verify public deploy from the prior release is live.
2. Google Cloud: the existing `roadbook-reader@enslain-roadbook-sync.iam.gserviceaccount.com`
   has Roadbook **Viewer** access and Google Sheets API enabled. Organization
   policy prohibits key creation; KEEP THAT POLICY ENABLED. Use **keyless
   Workload Identity Federation** for GitHub Actions; no long-lived JSON key
   or GitHub credential secret is needed:
   - Create a workload identity pool and OIDC provider for GitHub with issuer
     `https://token.actions.githubusercontent.com`. Attribute mapping must
     include `google.subject=assertion.sub` and
     `attribute.repository=assertion.repository`. Use a provider attribute
     condition restricting to `assertion.repository=='enslain-metal-merch/enslain'`
     (and `assertion.repository_id=='1414718352'` if available).
   - Bind the exact repository principal set to **Workload Identity User**
     on the reader service account (not project-wide Editor/Owner).
     Enable the IAM Service Account Credentials API if prompted.
   - GitHub Actions repository **variables** (not secrets):
     `ROADBOOK_GCP_WIF_PROVIDER` = full provider resource path beginning
     `projects/63861016766/locations/global/workloadIdentityPools/...`;
     `ROADBOOK_SHEET_ID` = existing Roadbook spreadsheet ID. Never put private
     Sheet contents, OAuth access tokens or key files in repository code.
   - GitHub workflow requests `id-token: write` only in the manual-preview
     and publishing jobs; `google-github-actions/auth@v3` mints a short-lived
     token with **sheets.readonly** scope. Importer requests only Events A:I,
     M:N, Q:R, T, plus Website Feed A:M; service account Viewer access to
     the file still technically permits more than those requested columns.
     Ensure the federation provider and IAM policy are tested with a
     manual dry-run; do not claim success solely from synthetic tests.
3. Run the **manual dry-run** in GitHub Actions and read the summary; audit
   whether the generated changes really match today's Roadbook, especially
   canceled/private gigs and the Kempele tour entry. Review generated
   HTML diff on a preview branch (no direct unreviewed auto-publish).
4. Check full integration tests, source/compiled code consistency, responsive
   tables, ticket links (none for past), family pages, client relationships,
   SEO links, and footer. Any discrepancy blocks launch.
5. Configure GitHub Actions permissions to allow contents:write for the
   scheduled workflow only. Activate the Tuesday schedule on an approved
   PR, then merge to master. Default workflow has **NO cron**; do not
   casually enable without all previous gates passing.
6. Confirm Netlify deploy on master. Snapshot/rollback target is the last
   known-good master commit. Record first Tuesday public output count.

## Tuesday October 20: First scheduled-run review

- Schedule: proposed Tuesday **11:33 Europe/Helsinki**, after verified
  morning Roadbook maintenance and 09:00 briefing; GitHub may delay execution.
  Require a genuinely healthy same-day maintenance checkpoint before publish.
  This health gate is still to implement and verify before activation.
- Confirm GitHub Action success, gated event count, changes by file,
  generated commit to master iff public HTML changed, and matching
  Netlify production deploy once. Confirm no unnecessary second deploy.
- Check Events Upcoming/Past counts, Brymir tour Kempele, artists,
  festival pages if and only if edition changed, sitemap/SEO shell,
  desktop/mobile and source confidentiality. If no public changes,
  report no deployment as a **success**, not an error.
- If job fails: do not force commit; inspect sanitized logs and rerun
  dry-run, then republish via manual review if necessary. A cancellation
  affecting private visibility gets a targeted urgent production fix.

## Known limitations / future work

- Current three 2026 tour pages are the active generated tour detail pages;
  historical 19 other tours in the index remain curated until their
  authoritative stable membership is mapped. Do not infer historical
  memberships from the internal Tour / Series field.
- The sitemap lists existing approved pages. No new artist/festival/tour
  paths are created by the weekly job. If a newly approved page is requested,
  create it via a reviewed PR and update sitemap.
- The current original HTML layout remains fully static for SEO; browser
  daily rollover corrects visible classifications, not raw HTML. Tuesday
  synchronizes the raw HTML again.
- GitHub Actions scheduled jobs on public repos may automatically disable
  after long inactivity; watch this and keep manual run available.

## Single Tuesday publication with Monday maintenance fallback

- Only **one** Tuesday 11:33 Europe/Helsinki scheduled publishing attempt; schedule remains disabled until owner-approved release. No routine afternoon, Wednesday or additional scheduled deployments.
- The first choice is the most recent verified same-day FULL OK Roadbook maintenance checkpoint. If Tuesday's maintenance failed or did not complete, the publisher may accept Monday's verified FULL OK checkpoint as a bounded fallback (only on Tuesday). It still reads the **current live** Events and Website Feed and applies every current event/publication permission, reconciliation, data-integrity, and generated-page safety check. It never publishes stale snapshots, unconfirmed/private gigs, or malformed data.
- With neither a verified Tuesday nor Monday healthy checkpoint, or with current public data failing validation, it fails closed and does not deploy. The existing website stays available; the regular daily briefing reports the missed Tuesday publish and proposes manual intervention rather than creating new reminder automations.
- One scheduled invocation, no second publishing run. No-op data must produce no commit and no Netlify deployment. Any manually approved urgent publication is separate, uses the exact same integrity gates, and must be deliberately initiated.
- The fallback is **maintenance freshness tolerance**, not permission to skip present-day public/private checks. The prior Monday check does not prove today's business reconciliation is complete; the 09:00 briefing already surfaces material maintenance issues.
