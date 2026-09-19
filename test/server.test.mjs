// Proves the MCP wiring, not just the function: a real client talks to a real server
// over an in-memory transport, lists the tool and calls it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';

async function connect(deps) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '0.0.0' });
  await Promise.all([createServer(deps).connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

test('exactly one tool is exposed, and it is the one we sell', async () => {
  const client = await connect({ apiKey: 'k', fetchImpl: async () => ({ status: 200, ok: true, json: async () => ({ items: [] }) }) });
  const { tools } = await client.listTools();
  assert.equal(tools.length, 1, 'MCP Basic is ONE tool. A second tool is a Build Packet.');
  assert.equal(tools[0].name, 'search_things');
  assert.match(tools[0].description, /not an error/);
  assert.ok(tools[0].inputSchema.properties.query, 'query is described in the schema');
  assert.deepEqual(tools[0].inputSchema.required, ['query'], 'query required, limit optional');
  await client.close();
});

test('calling the tool through MCP returns the formatted text', async () => {
  const body = { items: [{ id: 'a1', name: 'Alpha' }] };
  const client = await connect({ apiKey: 'k', fetchImpl: async () => ({ status: 200, ok: true, json: async () => body }) });
  const r = await client.callTool({ name: 'search_things', arguments: { query: 'al', limit: 5 } });
  assert.match(r.content[0].text, /1 match\(es\) for "al"/);
  await client.close();
});

test('a bad argument is rejected by the schema, not by the handler', async () => {
  const client = await connect({ apiKey: 'k', fetchImpl: async () => { throw new Error('must not be called'); } });
  const r = await client.callTool({ name: 'search_things', arguments: { query: 'x', limit: 999 } });
  assert.equal(r.isError, true, 'limit is capped at 50 in the schema');
  await client.close();
});
