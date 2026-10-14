# Enslain Roadbook → Website: Tuesday automation launch plan

**Status (Oct 14): prepared on draft branch, NOT enabled or released.**
Monday October 19: inspect dry-run, set up read-only access, release approved
workflow to master and arm Tuesday. Tuesday October 20: monitor first run.

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

## Monday October 19: Activation gates (no shortcuts)

1. Confirm Netlify Free usage/budget and that **only master** deploys
   production. Verify public deploy from the prior release is live.
2. Google Cloud: create a **dedicated service account**, with Sheets API
   enabled and no Editor/Owner roles for Roadbook. Share the existing
   private Roadbook **Viewer** access with the service-account email.
   Keep the JSON key private; don't paste it into GitHub files, this chat,
   Roadbook, PR comments, or build logs. Set GitHub repo Actions secret
   GOOGLE_SERVICE_ACCOUNT_JSON to its full JSON, with literal newlines
   preserved. Set the repo Actions variable ROADBOOK_SHEET_ID to the
   spreadsheet ID. Revoke an exposed key immediately.
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

- Schedule: proposed 06:12 UTC each Tuesday (08:12 in Helsinki winter,
  09:12 in Helsinki summer); runs may be delayed by GitHub Actions.
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
