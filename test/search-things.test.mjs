// Unhappy paths first, because that is where a bought tool actually fails on a buyer.
// No key, no network, no Claude needed: every case here runs offline.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeSearchThings } from '../src/search-things.js';

const reply = (status, body) => async () => ({
  status, ok: status >= 200 && status < 300, json: async () => body,
});

test('missing key is a readable message, not a crash', async () => {
  const r = await makeSearchThings({ apiKey: undefined })({ query: 'x' });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /THING_API_KEY is not set/);
});

test('401 says the key was rejected', async () => {
  const r = await makeSearchThings({ apiKey: 'k', fetchImpl: reply(401, {}) })({ query: 'x' });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /rejected the key/);
});

test('403 is treated the same as 401', async () => {
  const r = await makeSearchThings({ apiKey: 'k', fetchImpl: reply(403, {}) })({ query: 'x' });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /rejected the key/);
});

test('429 tells them to wait', async () => {
  const r = await makeSearchThings({ apiKey: 'k', fetchImpl: reply(429, {}) })({ query: 'x' });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /rate limit/);
});

test('other non-2xx reports the status', async () => {
  const r = await makeSearchThings({ apiKey: 'k', fetchImpl: reply(503, {}) })({ query: 'x' });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /returned 503/);
});

test('network failure is a sentence, never a stack trace', async () => {
  const boom = async () => { throw new Error('getaddrinfo ENOTFOUND api.example.com'); };
  const r = await makeSearchThings({ apiKey: 'k', baseUrl: 'https://api.example.com', fetchImpl: boom })({ query: 'x' });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /Could not reach https:\/\/api\.example\.com/);
  assert.doesNotMatch(r.content[0].text, /at Object\.|\n\s+at /);
});

test('non-JSON body does not throw', async () => {
  const bad = async () => ({ status: 200, ok: true, json: async () => { throw new SyntaxError('Unexpected token <'); } });
  const r = await makeSearchThings({ apiKey: 'k', fetchImpl: bad })({ query: 'x' });
  assert.equal(r.isError, true);
  assert.match(r.content[0].text, /not JSON/);
});

test('empty result is NOT an error', async () => {
  const r = await makeSearchThings({ apiKey: 'k', fetchImpl: reply(200, { items: [] }) })({ query: 'nothing' });
  assert.equal(r.isError, undefined);
  assert.match(r.content[0].text, /No THINGs matched "nothing"/);
});

test('a missing items array reads as empty, not as a crash', async () => {
  const r = await makeSearchThings({ apiKey: 'k', fetchImpl: reply(200, {}) })({ query: 'q' });
  assert.equal(r.isError, undefined);
  assert.match(r.content[0].text, /No THINGs matched/);
});

test('happy path lists name and id', async () => {
  const body = { items: [{ id: 'a1', name: 'Alpha', updated_at: '2026-09-01' }, { id: 'b2', name: 'Beta' }] };
  const r = await makeSearchThings({ apiKey: 'k', fetchImpl: reply(200, body) })({ query: 'a' });
  assert.equal(r.isError, undefined);
  assert.match(r.content[0].text, /2 match\(es\) for "a"/);
  assert.match(r.content[0].text, /- Alpha \(a1\) updated 2026-09-01/);
  assert.match(r.content[0].text, /- Beta \(b2\)$/m);
});

test('the key travels in the header and the query is encoded', async () => {
  let seen = null;
  const spy = async (url, init) => { seen = { url, init }; return { status: 200, ok: true, json: async () => ({ items: [] }) }; };
  await makeSearchThings({ apiKey: 'secret-key', baseUrl: 'https://api.test', fetchImpl: spy })({ query: 'two words&x', limit: 3 });
  assert.equal(seen.url, 'https://api.test/things?q=two%20words%26x&limit=3');
  assert.equal(seen.init.headers.Authorization, 'Bearer secret-key');
});

test('limit defaults to 10 when the caller omits it', async () => {
  let seen = null;
  const spy = async (url) => { seen = url; return { status: 200, ok: true, json: async () => ({ items: [] }) }; };
  await makeSearchThings({ apiKey: 'k', baseUrl: 'https://api.test', fetchImpl: spy })({ query: 'q' });
  assert.match(seen, /limit=10$/);
});
