import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from './server.mjs';

async function invoke(handler, method = 'POST', url = '/trigger') {
  let code, body;
  await handler({ method, url }, { writeHead(c) { code = c; }, end(x) { body = JSON.parse(x); } });
  return { code, body };
}

test('reject non-trigger paths', async () => {
  const h = createHandler({ token: 'mock-secret', fetchImpl: () => { throw Error('must not reach GitHub'); } });
  assert.equal((await invoke(h, 'GET')).code, 404);
  assert.equal((await invoke(h, 'POST', '/nope')).code, 404);
});

test('reports missing credential without triggering publication', async () => {
  const h = createHandler({ token: '', fetchImpl: () => { throw Error('must not reach GitHub'); } });
  assert.equal((await invoke(h)).code, 503);
});

test('dispatch always selects master and explicit publish', async () => {
  let call;
  const h = createHandler({ token: 'test-secret', fetchImpl: async (url, opts) => {
    call = { url, opts };
    return { status: 200, json: async () => ({ workflow_run_id: 123, html_url: 'https://github.com/enslain-metal-merch/enslain/actions/runs/123' }) };
  } });
  const { code, body } = await invoke(h);
  assert.equal(code, 200);
  assert.equal(body.run.id, 123);
  assert.deepEqual(JSON.parse(call.opts.body), { ref: 'master', inputs: { publish: 'true' } });
  assert.match(call.url, /roadbook-tuesday\.yml\/dispatches$/);
  assert.equal(call.opts.headers.authorization, 'Bearer test-secret');
});

test('accepts legacy no-content success', async () => {
  const h = createHandler({ token: 'test-secret', fetchImpl: async () => ({ status: 204 }) });
  assert.deepEqual(await invoke(h), { code: 200, body: { ok: true, workflow: 'roadbook-tuesday.yml' } });
});

test('fails closed on GitHub rejection and network error', async () => {
  const h1 = createHandler({ token: 'test-secret', fetchImpl: async () => ({ status: 403 }) });
  assert.equal((await invoke(h1)).code, 502);
  const h2 = createHandler({ token: 'test-secret', fetchImpl: async () => { throw Error('backend error'); } });
  assert.equal((await invoke(h2)).code, 502);
});
