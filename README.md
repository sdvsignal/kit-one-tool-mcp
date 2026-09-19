# one-tool-mcp

A working sample of what an **MCP Basic** build from [Kit](https://kit-sdvsignal.pages.dev) looks like: one MCP tool, a described schema, the unhappy paths handled, a smoke prompt, and a clean removal path. Clone it, rename `THING`, and you have the shape.

It is deliberately one tool. A second tool, or a Cloudflare Worker, is a Build Packet, not a bigger version of this.

## Try it without an API key

The tests run offline. No key, no network, no Claude.

```bash
npm install
npm test
```

15 tests. Most of them are unhappy paths, because that is where a bought tool actually fails on somebody: missing key, 401, 403, 429, a 503, a DNS failure, a body that is not JSON, and an empty result. Three of them stand up a real MCP client against the real server over an in-memory transport and call the tool, so the wiring is tested, not just the function.

## What is in here

| File | What it is |
|---|---|
| `src/search-things.js` | The one tool. Takes its dependencies as an argument, which is why it is testable without a key. |
| `src/server.js` | Server wiring. Registers exactly one tool. |
| `src/index.js` | The entrypoint. Connects stdio and nothing else. |
| `test/` | The 15 tests above. |

## Add it to Claude Code

```bash
export THING_API_KEY=...
claude mcp add one-tool -- node /absolute/path/to/one-tool-mcp/src/index.js
```

Claude Desktop instead: add this to the config file and restart the app.

```json
{
  "mcpServers": {
    "one-tool": {
      "command": "node",
      "args": ["/absolute/path/to/one-tool-mcp/src/index.js"],
      "env": { "THING_API_KEY": "..." }
    }
  }
}
```

Your key lives in your environment. It is not in this repo, and there is no default value that quietly works.

## Smoke prompt

Type this to Claude. This is the test that it is really wired up:

> Search THING for "onboarding" and show me the top 3.

You should get up to 3 results with names and ids. If nothing matches you get `No THINGs matched "onboarding"`, which is correct and not a failure. Telling the model that an empty result is empty is most of why it stops retrying.

## Remove it

```bash
claude mcp remove one-tool
```

Claude Desktop: delete the `one-tool` block and restart. The server keeps no state, so nothing is left behind.

## Errors you may see

| Message | Means |
|---|---|
| `THING_API_KEY is not set` | env var missing, or Claude was not restarted after you set it |
| `THING rejected the key (401/403)` | wrong or revoked key |
| `THING rate limit hit (429)` | wait, then retry |
| `THING returned 503` | their side, not yours |
| `Could not reach https://...` | network, or `THING_BASE_URL` is wrong |
| `THING returned something that was not JSON` | usually an HTML error page from a proxy |

None of them return a stack trace. A tool that throws raw errors at the model makes it guess.

## Making it yours

1. Rename `search_things` for what it actually does, from the caller's point of view.
2. Write the input schema before the implementation. Every field described, required vs optional explicit.
3. Keep the description aimed at the model: say **when** to reach for the tool, not only what it is.
4. Point `THING_BASE_URL` and the auth header at the real API.
5. Run `npm test`, then run the smoke prompt in Claude. A passing test is not proof the tool works against the real API.

## Want this built for your API instead

**MCP Basic, $199.** One tool, the schema, handoff notes, a smoke prompt and the enable/disable path, built against your API and tested against it before delivery. Need more than one tool, or a Worker? That is the **Build Packet, $399**.

Both are on the Kit page: **https://kit-sdvsignal.pages.dev**

MIT licensed. Use it for your own work, no attribution needed.
