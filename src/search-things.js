// The one tool, kept separate from the server wiring so it can be tested without a network,
// without a key, and without Claude running. `deps` exists for exactly that reason.
import { z } from 'zod';

export const TOOL_NAME = 'search_things';

export const TOOL_CONFIG = {
  title: 'Search things',
  // Written for the model: say WHEN to reach for this, not just what it is.
  description:
    'Search THING by free-text query. Use when the user asks what THINGs exist, ' +
    'or asks about a THING by name. Returns up to `limit` matches, newest first. ' +
    'Returns an empty list when nothing matches, which is not an error.',
  inputSchema: {
    query: z.string().min(1).describe('Free-text search. Required.'),
    limit: z.number().int().min(1).max(50).default(10)
      .describe('How many to return, 1 to 50. Defaults to 10.'),
  },
};

const text = (t, isError = false) => (isError
  ? { isError: true, content: [{ type: 'text', text: t }] }
  : { content: [{ type: 'text', text: t }] });

/**
 * @param {{apiKey?: string, baseUrl?: string, fetchImpl?: typeof fetch}} deps
 */
export function makeSearchThings(deps = {}) {
  const apiKey = 'apiKey' in deps ? deps.apiKey : process.env.THING_API_KEY;
  const baseUrl = deps.baseUrl ?? process.env.THING_BASE_URL ?? 'https://api.example.com';
  const doFetch = deps.fetchImpl ?? fetch;

  return async function searchThings({ query, limit = 10 }) {
    if (!apiKey) return text('THING_API_KEY is not set. Add it to the env and restart Claude.', true);

    let res;
    try {
      res = await doFetch(`${baseUrl}/things?q=${encodeURIComponent(query)}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      });
    } catch (e) {
      // Network failure reads as a sentence, never a stack trace.
      return text(`Could not reach ${baseUrl}: ${e.message}`, true);
    }

    if (res.status === 401 || res.status === 403) return text('THING rejected the key (401/403). Check THING_API_KEY.', true);
    if (res.status === 429) return text('THING rate limit hit (429). Wait and try again.', true);
    if (!res.ok) return text(`THING returned ${res.status}.`, true);

    let data;
    try {
      data = await res.json();
    } catch {
      return text('THING returned something that was not JSON.', true);
    }

    const items = Array.isArray(data?.items) ? data.items : [];
    // Empty is empty. An empty result is not a failure, and saying so stops the model retrying.
    if (items.length === 0) return text(`No THINGs matched "${query}".`);

    const lines = items.map((t) => `- ${t.name} (${t.id})${t.updated_at ? ` updated ${t.updated_at}` : ''}`);
    return text(`${items.length} match(es) for "${query}":\n${lines.join('\n')}`);
  };
}
