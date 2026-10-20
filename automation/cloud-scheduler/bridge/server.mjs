import { createServer } from 'node:http';

const WORKFLOW_DISPATCH_URL = 'https://api.github.com/repos/enslain-metal-merch/enslain/actions/workflows/roadbook-tuesday.yml/dispatches';

/** Fixed-purpose dispatcher. Cloud Run IAM authenticates incoming requests. */
export function createHandler({ token = process.env.GITHUB_DISPATCH_TOKEN, fetchImpl = fetch } = {}) {
  return async function handler(req, res) {
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    if (req.method !== 'POST' || path !== '/trigger') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Not found' }));
      return;
    }
    if (!token) {
      res.writeHead(503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'GitHub dispatch credential not configured' }));
      return;
    }
    try {
      const response = await fetchImpl(WORKFLOW_DISPATCH_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/vnd.github+json',
          'authorization': `Bearer ${token}`,
          'x-github-api-version': '2026-03-10',
          'content-type': 'application/json',
          'user-agent': 'enslain-roadbook-cloud-scheduler',
        },
        body: JSON.stringify({ ref: 'master', inputs: { publish: 'true' } }),
        signal: AbortSignal.timeout(20000),
      });
      if (![200, 201, 204].includes(response.status)) {
        // Do not expose GitHub response bodies or credentials to callers/logs.
        console.error('GitHub workflow dispatch rejected; HTTP status', response.status);
        res.writeHead(502, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'GitHub dispatch failed', githubStatus: response.status }));
        return;
      }
      let run = null;
      if (response.status !== 204) {
        try {
          const data = await response.json();
          if (Number.isInteger(data.workflow_run_id) && /^https:\/\/github\.com\/enslain-metal-merch\/enslain\/actions\/runs\/\d+$/.test(data.html_url || '')) {
            run = { id: data.workflow_run_id, url: data.html_url };
          }
        } catch { /* Legacy GitHub response may have no JSON body. */ }
      }
      console.log('GitHub production workflow dispatched', run?.id || '(no run ID returned)');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, workflow: 'roadbook-tuesday.yml', ...(run ? { run } : {}) }));
    } catch (error) {
      console.error('GitHub workflow dispatch network failure', error?.name || 'Error');
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'GitHub dispatch network failure' }));
    }
  };
}

if (process.env.NODE_ENV !== 'test') {
  createServer(createHandler()).listen(Number(process.env.PORT || 8080), '0.0.0.0', () => {
    console.log('Enslain Roadbook dispatch bridge ready');
  });
}
