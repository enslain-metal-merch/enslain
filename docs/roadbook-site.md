# Roadbook website publishing — next version

**This is a test branch. Automated production publishing is NOT enabled.**

The website generator reads native Google Sheets Events and Website Feed using a **dedicated read-only Google service account**. The private credential is never in the GitHub repository, browser, generated pages or public feed. It is supplied at Netlify build time as a secret environment variable.

## Proposed 03:00 Europe/Helsinki schedule
- Netlify Scheduled Function netlify/functions/roadbook-nightly.mjs runs at 00:00 and 01:00 UTC but checks the local clock, triggering a build **only once**, at 03:00 Europe/Helsinki including DST changes.
- It calls a private Netlify build hook stored in Netlify's environment variable NETLIFY_ROADBOOK_BUILD_HOOK. Without that secret it does nothing.
- Netlify runs the website generator afresh; there are **no nightly GitHub commits**, and no inactivity-based 60-day GitHub Actions schedule cutoff.
- The function schedules itself only in production deploys, not in PR Deploy Previews. A separate Netlify 'Run now' or manual build request is possible for urgent removals.

## One-time setup, AFTER review and approval
1. Create a dedicated Google Cloud service account; enable Google Sheets API. Share Roadbook with its email address as **Viewer only**.
2. Add GOOGLE_SERVICE_ACCOUNT_JSON (the key JSON) and ROADBOOK_SHEET_ID to **Netlify private environment settings**. NEVER put keys in source files, Google Sheets cells, screenshots or chat.
3. Configure Netlify build command: npm install && npm run build:roadbook. Keep publish directory as public. Netlify should run this for Deploy Previews and production when the secrets exist.
4. Add a Netlify Build Hook on the Enslain-owned site for master. Put its URL into Netlify private environment variable NETLIFY_ROADBOOK_BUILD_HOOK, accessible to the scheduled function. Never make the hook public.
5. Verify fresh published events, automatic Upcoming→Past movement, privacy withdrawal, failure handling, links, and rollback; approve auto-publishing separately.

## Privacy / quality guarantees
Only events with **Status Confirmed, Public? Yes and Feed Publish Yes** may be emitted. The generator joins stable Event IDs, checks public-field agreement, rejects duplicates and broken dates, and emits only approved display fields. Tour / Series and Client Summary remain in build memory for relationship matching and are not written to public output. It never exports staff assignments, money, internal notes, private statuses or private records. Errors fail the build so Netlify keeps the last successful deploy.

A private-status withdrawal is not instantaneous: the static website stops displaying the event on the *next successful* rebuild. For an urgent cancellation/privacy withdrawal, run the build immediately, rather than waiting until 03:00.

Initial pilot pages: /artists/, /artists/kaunis-kuolematon/, /festivals/, /festivals/steelfest/, /touring-history/, /touring-history/2026-kaunis-kuolematon/. The index pages show approved registries but only the three pilots have dedicated detail links so far. Older tours need manual event-group verification before generation.

**Important build-source limitation:** The first version updates the compiled public/events/index.html as the base shell. Once the mechanism is approved, consolidate event source templates and generator output to prevent future CodeKit overwrites. This preview leaves the live site unchanged.
