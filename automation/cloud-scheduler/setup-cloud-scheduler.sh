#!/usr/bin/env bash
# One-time setup in YOUR authenticated Google Cloud Shell. No token belongs in Git or ChatGPT.
set -euo pipefail

PROJECT_ID="enslain-roadbook-sync"
REGION="europe-north1"
SERVICE="roadbook-github-dispatch"
JOB="roadbook-tuesday-1133"
SECRET="roadbook-github-actions-token"
RUNTIME_NAME="roadbook-dispatch-runtime"
INVOKER_NAME="roadbook-scheduler-invoker"
HERE="$(cd "$(dirname "$0")" && pwd)"

command -v gcloud >/dev/null || { echo 'Use Google Cloud Shell: gcloud is required.' >&2; exit 1; }
echo "Project: $PROJECT_ID. Region: $REGION. Schedule: Tuesday 11:33 Europe/Helsinki."
echo 'Cloud Run, Cloud Scheduler and the build process can incur charges. Check billing and permissions before continuing.'
read -r -p 'Enable cloud services and deploy? Type YES: ' approve
[[ "$approve" == 'YES' ]] || { echo 'No changes made.'; exit 1; }

gcloud config set project "$PROJECT_ID" >/dev/null
gcloud services enable run.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com iam.googleapis.com --project="$PROJECT_ID"

for name in "$RUNTIME_NAME" "$INVOKER_NAME"; do
  email="$name@$PROJECT_ID.iam.gserviceaccount.com"
  if ! gcloud iam service-accounts describe "$email" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$name" --display-name="Enslain $name" --project="$PROJECT_ID"
  fi
done
RUNTIME_EMAIL="$RUNTIME_NAME@$PROJECT_ID.iam.gserviceaccount.com"
INVOKER_EMAIL="$INVOKER_NAME@$PROJECT_ID.iam.gserviceaccount.com"

if ! gcloud secrets describe "$SECRET" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud secrets create "$SECRET" --replication-policy=automatic --project="$PROJECT_ID"
fi

echo 'Create a fine-grained GitHub PAT: enslain-metal-merch/enslain only; Actions = Read and write.'
echo 'Paste the token into this HIDDEN prompt. It will go to Google Secret Manager, not the repository.'
IFS= read -r -s -p 'GitHub token (hidden input): ' GITHUB_PAT
printf '\n'
[[ -n "$GITHUB_PAT" ]] || { echo 'Missing token. Aborting.' >&2; exit 1; }
printf '%s' "$GITHUB_PAT" | gcloud secrets versions add "$SECRET" --data-file=- --project="$PROJECT_ID"
unset GITHUB_PAT

gcloud secrets add-iam-policy-binding "$SECRET" \
  --member="serviceAccount:$RUNTIME_EMAIL" \
  --role=roles/secretmanager.secretAccessor --project="$PROJECT_ID" >/dev/null

gcloud run deploy "$SERVICE" \
  --source="$HERE/bridge" --region="$REGION" --project="$PROJECT_ID" \
  --no-allow-unauthenticated --service-account="$RUNTIME_EMAIL" \
  --set-secrets="GITHUB_DISPATCH_TOKEN=$SECRET:latest" --quiet

RUN_URL="$(gcloud run services describe "$SERVICE" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
[[ "$RUN_URL" == https://* ]] || { echo 'Cloud Run URL missing; no scheduler job created.' >&2; exit 1; }

gcloud run services add-iam-policy-binding "$SERVICE" \
  --region="$REGION" --project="$PROJECT_ID" \
  --member="serviceAccount:$INVOKER_EMAIL" --role=roles/run.invoker >/dev/null

# Both create and update require all desired settings, to stay idempotent.
if gcloud scheduler jobs describe "$JOB" --project="$PROJECT_ID" --location="$REGION" >/dev/null 2>&1; then
  ACTION=update
else
  ACTION=create
fi
gcloud scheduler jobs "$ACTION" http "$JOB" \
  --project="$PROJECT_ID" --location="$REGION" \
  --schedule='33 11 * * 2' --time-zone='Europe/Helsinki' \
  --uri="$RUN_URL/trigger" --http-method=POST \
  --oidc-service-account-email="$INVOKER_EMAIL" --oidc-token-audience="$RUN_URL" \
  --attempt-deadline='30s' --max-retry-attempts=3 \
  --min-backoff='30s' --max-backoff='600s' \
  --description='Enslain Tuesday 11:33 Helsinki validated public site publication'

gcloud scheduler jobs describe "$JOB" --project="$PROJECT_ID" --location="$REGION" \
  --format='yaml(name,schedule,timeZone,state,httpTarget.uri,retryConfig)'
echo 'Independent trigger configured. GitHub 13:47 Tuesday fallback remains active.'
read -r -p 'Run one supervised production publish now? Type PUBLISH: ' run_now
if [[ "$run_now" == 'PUBLISH' ]]; then
  gcloud scheduler jobs run "$JOB" --project="$PROJECT_ID" --location="$REGION"
  echo 'Dispatch requested. Verify the GitHub workflow conclusion and Netlify deployment before declaring success.'
else
  echo 'No immediate dispatch. First independent scheduled attempt is next Tuesday at 11:33 Helsinki.'
fi
