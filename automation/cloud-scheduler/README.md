# Independent Enslain Roadbook Tuesday publisher trigger

**Status: code prepared, but NOT deployed to Google Cloud until setup is run there and verified.** No public site changes are performed by this setup code.

## Architecture

1. Google Cloud Scheduler: Tuesday **11:33 Europe/Helsinki** in existing project `enslain-roadbook-sync`.
2. Cloud Scheduler authenticates with Google OIDC as a dedicated `roadbook-scheduler-invoker` service account to private Cloud Run service `roadbook-github-dispatch`. Public/unauthenticated invocation is forbidden.
3. Cloud Run reads a single **fine-grained GitHub Actions-write token** from Google Secret Manager and dispatches `.github/workflows/roadbook-tuesday.yml` with `ref=master`, `publish=true`. No arbitrary repository, branch, inputs, data, or calls are accepted.
4. GitHub then runs all existing Roadbook privacy, validation, repeat-read, safety and conditional-commit gates. Netlify deploys **only** when approved public site content changes.
5. GitHub's existing **13:47 Tuesday Helsinki** cron is the fallback. Both triggers remain idempotent: unchanged output = no commit = no Netlify build.

Only the fixed GitHub dispatch request is sent by the bridge, never private Roadbook source data.

## One-time deployment — authenticated Google Cloud Shell

1. Open [Google Cloud Console](https://console.cloud.google.com/?project=enslain-roadbook-sync) for project `enslain-roadbook-sync`. Confirm billing/account permissions. Cloud Scheduler/Cloud Run/build services **may incur charges**, even though low traffic may qualify for free usage. Deployment is not authorized by GitHub repository access alone.
2. From GitHub, [create a fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) with **Resource owner** `enslain-metal-merch`, **only repository** `enslain`, and **Actions: Read and write**. No Contents write, project-admin or whole-account authorization required. Some organizations require approval. Choose a suitable expiration, and track the renewal date: an expired token will stop dispatching.
3. Open **Cloud Shell** in the Google Cloud Console. Paste these commands:

   ```bash
   git clone https://github.com/enslain-metal-merch/enslain.git
   cd enslain
   bash automation/cloud-scheduler/setup-cloud-scheduler.sh
   ```

   The script asks for an explicit `YES`, enables required Google Cloud APIs, creates two least-privilege service accounts and a Secret Manager secret, prompts for the GitHub token in **hidden input**, deploys private Cloud Run, grants only scheduler identity the Cloud Run Invoker role, and creates/updates the 11:33 Helsinki Scheduler job with three bounded retries. It then reads back the job configuration.

4. When asked whether to publish **now**, type `PUBLISH` only if ready for a supervised production run. It sends exactly one request to Cloud Scheduler. Check [GitHub Actions](https://github.com/enslain-metal-merch/enslain/actions/workflows/roadbook-tuesday.yml) for a new `workflow_dispatch` event and **successful `scheduled_publish` job**, then confirm commit/no-op and Netlify production result. A successful Scheduler response alone does **not** prove publication.
5. Preserve the GitHub 13:47 fallback until the independent 11:33 trigger has been observed working.

**Never paste the GitHub token into ChatGPT, a chat message, or a Git commit.** Enter it directly into Google Cloud Shell at the hidden prompt.

## Operations and verification

- [Cloud Scheduler console](https://console.cloud.google.com/cloudscheduler?project=enslain-roadbook-sync)
- [Cloud Run services](https://console.cloud.google.com/run?project=enslain-roadbook-sync)
- [GitHub publisher workflow](https://github.com/enslain-metal-merch/enslain/actions/workflows/roadbook-tuesday.yml)
- Token scope: Actions write, one repository only. Renew the token before expiration by storing a new Secret Manager version and redeploying/restarting if necessary to pick up the new secret. **No automatic indefinite token lifetime is guaranteed.**
- A Cloud Scheduler response with HTTP 200 means the dispatch was accepted; it does not prove GitHub tests/publication or Netlify deployment. Verify both downstream stages.
- For `401/403` from GitHub: check PAT expiry, Actions permission and organization approval. For Cloud Run `403`: check Scheduler service-account invoker IAM and OIDC audience. For publication failures: inspect the GitHub workflow job logs; never bypass the public-only guards.
- Local tests, no network or publishing:

  ```bash
  cd automation/cloud-scheduler/bridge
  npm test
  ```

This setup is intentionally separate from the business 05:00/09:00 ChatGPT automations. No new ChatGPT scheduled task is needed.
