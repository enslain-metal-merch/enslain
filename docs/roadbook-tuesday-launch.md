# Enslain website — Tuesday publisher release notes (15 October 2026)

## Current status
- Draft PR #12, branch `roadbook-tuesday-prep-20261014`, unmerged.
- **Not deployed.** The Tuesday cron is configured only in draft PR #12, and activates only when this PR is merged to master with owner approval.
- Latest isolated-feed GitHub live tests/preview: https://github.com/enslain-metal-merch/enslain/actions/runs/38802520845 — passed.
- No Netlify preview or master commit was created by this validation.

## Data flow
1. Private Roadbook (ID `1ojAjW7izL3GVxkm3d3GBTVx51tE1JicgCueMP9lkez4`) owns the facts in `Events` and editorial overrides in `Website Feed`.
2. Hidden `Website Public Export` tab uses one formula to join by **Event ID** and include ONLY rows satisfying Events Status=`Confirmed`, Events Public?=`Yes`, and Website Feed Publish=`Yes`. Facts come from `Events`, not cached Website Feed copies.
3. Separate document `Enslain Website Publishing Feed`: https://docs.google.com/spreadsheets/d/1LKglCQg-cUiNPYTQQD7b32knAFXekyjlt29I6lm0tNM/edit . Its `Public Events` tab imports ONLY `Website Public Export!A1:N2000` via a Google-owner-authorized `IMPORTRANGE`.
4. GitHub's keyless service account `roadbook-reader@enslain-roadbook-sync.iam.gserviceaccount.com` has **Viewer** access to the separate file. Website fetch code calls the separate file ID only, and does not download the private Roadbook or Agent State.
5. The page generator consumes that isolated public-only input, updates Events / Artists / Festivals / Touring History, and commits only on changed output. Netlify production deploy happens from `master` on commit.

## Security boundary
- Do not share the private Roadbook with the GitHub service account once final validation is complete.
- **COMPLETED AND VERIFIED:** the owner removed the service account from private Roadbook; Google Drive permissions were inspected afterwards. Its Viewer access to the separate public feed was also verified. The post-removal GitHub live connection test passed.
- Limit destination **Editor** rights to the Roadbook owner/trusted maintainers. Editors of an `IMPORTRANGE` receiving spreadsheet can potentially request extra ranges from its authorized source. The GitHub bot is Viewer only.
- This is a practical improvement, not an airtight isolation boundary.

## Timing and resilience
- Configured Tuesday trigger in draft: **11:33 Europe/Helsinki**, using timezone-aware GitHub Actions cron. Not active until master merge.
- Current local test showed two source-to-closed-destination changes propagating within 7–12 seconds (not a guaranteed bound).
- A single Tuesday job fetches, generates, **re-fetches 15 seconds later** before committing. If the feed changed, it waits a further 60 seconds and fetches again. If still changing, it fails closed without a deployment. No second scheduled job, no multiple pushes.
- If the mirrored feed is slow to refresh beyond this window, some late Roadbook edits could still miss that week's push. For a weekly, non-critical site that is an accepted tradeoff; do not claim this is an exact source-edit timestamp guard.
- Routine editing and Book Maintenance do **not** await the separate feed. Only the GitHub publisher reads it.
- Generator verifies data shape, duplicated IDs, calendar dates, output structure and idempotence. It performs no writes if content is unchanged.
- Publishing no longer blocks on private `Agent State` maintenance health because the bot cannot and should not access that tab. Roadbook's own QA still manages source-side inconsistencies.

## Validation
- Source `Website Public Export` and destination `Public Events` each contained exactly 879 approved events, identical in all 14 columns at 15 October validation.
- Reconciled against 945 Roadbook Events and 881 Website Feed rows: no missing approved or accidentally included unapproved Event IDs at test time.
- GitHub test, live isolated service-account read, full generated site preview and rerun-idempotence passed.
- Production not updated. Further manual release step still requires owner approval to merge and enable cron.

## Remaining steps
1. Private Roadbook permission revoked and post-cutover live check passed; no owner action needed for Google sharing.
2. **Owner release decision:** approve one merge of draft PR #12 to master. Keep `[skip netlify]` in the actual merge commit message to avoid a site deployment merely for installing automation; the first content-changing Tuesday commit will deploy normally. No extra Netlify preview.
3. Verify next Tuesday's first scheduled publication and Netlify outcome. Weekly schedule is a best-effort GitHub Actions trigger; an exact 11:33 start is not guaranteed.
4. Verify normal Roadbook edits continue to propagate; fix source-side Website Feed omissions through normal Roadbook QA. Netlify credit balance has not been independently inspected.
