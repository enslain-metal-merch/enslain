# ChatGPT-initiated Roadbook website publication

Primary dispatch is the existing ChatGPT automation, **every Tuesday at 11:33 Europe/Helsinki**. This is **independent of GitHub's cron**. GitHub keeps one **13:47 Europe/Helsinki** backup schedule.

## How to start a publication

With the user's existing standing authorization for the Tuesday window (or when the user explicitly says "publish"), use the installed GitHub connector to:

1. Read the **exact** file `automation/roadbook-publish-signal.json` from default branch `master`.
2. If it exists, update it using its current blob SHA. Otherwise create it only after the workflow has been installed and reviewed.
3. Write valid JSON recording `schemaVersion: 1`, an ISO 8601 UTC `requestedAt` timestamp, `requestedBy: "ChatGPT"`, and `reason: "weekly" | "user-request"`. Avoid personal/private data. Ensure it actually changes versus the previous revision. Use a unique UTC timestamp for a requested manual rerun.
4. Use commit message **`Request Roadbook public website publication [roadbook-publish] [skip netlify]`**. `[skip netlify]` ensures the signal commit itself does not deploy the website.
5. Read back the signal file and inspect the Actions run for this push. `master` changes to only the signal file are matched by the workflow's push-path filter. The `[roadbook-publish]` token is additionally required in the commit message to allow the production job.
6. Verify the `tests` and `scheduled_publish` jobs of the **push-triggered** run. An Actions run beginning is not publishing success.
7. Verify the resulting source commit or verified no-change suppression, then Netlify site/public content if a publication occurred. Do not assert success without actual evidence.
8. If the tool can't write to GitHub, the Actions push doesn't fire, tests fail, or the publication fails, **tell the user**, capture the concrete failure, and do not invent success. Do not bypass tests, privacy gates or live Google authentication. If the same weekly signal was already sent, avoid duplicate commits unless a deliberately authorized retry is needed.

## Protections

- Only the signal path triggers publishing from repository pushes, and only on `master`. Ordinary code pushes and PR tests are not production publishing triggers.
- Manual GitHub `workflow_dispatch` keeps `publish=false` by default; explicitly checked `publish=true` on `master` is a separate authorized emergency route.
- The Tuesday 13:47 GitHub schedule is retained as fallback. Both the push trigger and the scheduled trigger use the same workflow's `roadbook-production-sync` concurrency lock and single-commit/no-public-diff guard.
- `scheduled_publish` reads Google Sheets using existing keyless OIDC. It validates public-only data, all website rules, stability after a second read, and tests before writing. No changes = no website commit and no Netlify publication.
- Browser-based Helsinki 05:00 Upcoming→Past rollover continues independently.

**Do not restore the Google Cloud Scheduler/Cloud Run bridge.** That alternative was explicitly rejected in favor of ChatGPT's schedule, and none of its cloud services was provisioned.

## Last confirmed tests

See GitHub Actions for workflow `.github/workflows/roadbook-tuesday.yml`. For this architecture, a real `push`-triggered production run is essential proof. A passing pull-request test is insufficient.
