# kit-one-tool-mcp

![license MIT](https://img.shields.io/badge/license-MIT-3da639) ![tests 15 offline](https://img.shields.io/badge/tests-15%20offline-3da639) ![api key not needed](https://img.shields.io/badge/api%20key-not%20needed-3da639) [![listed on glama](https://img.shields.io/badge/listed%20on-glama-6b4fbb)](https://glama.ai/mcp/servers/sdvsignal/kit-one-tool-mcp) [![8 more servers wired $49](https://img.shields.io/badge/8%20more%20servers%20wired-$49-1f5f4a)](https://buy.stripe.com/aFaeVfcsf0fc1v42sVf3a08?client_reference_id=from-gh-badge-mcp)

**Most MCP examples show you the happy path and then fail on somebody's laptop at 401.** This one is
the opposite: one tool, a described schema, and 15 tests that are mostly the unhappy paths — missing
key, 401, 403, 429, 503, DNS failure, non-JSON body, empty result.

Clone it, rename `THING`, and you have the shape of a working MCP server. It is a sample of what an
**MCP Basic** build from Kit looks like when it is handed over.

If you came here looking for a one tool MCP sample, an MCP server example in TypeScript, or a way to test an MCP
tool with no API key and no network, this is that.

It is deliberately one tool. A second tool, or a Cloudflare Worker, is a Build Packet, not a bigger version of this.

## Want your repo set up for Claude Code first?

This repo is MIT and complete — take it and go. If you want a CLAUDE.md, a tool allowlist and one
skill wired for *your* repo:

**[Buy Setup Lite — $29](https://buy.stripe.com/3cI14pcsf6DA8Xw4B3f3a0a?client_reference_id=from-gh-one-tool-mcp)** · ~24h, handed back as a PR.

Details: [kit.sdvsignal.com/#setup-lite](https://kit.sdvsignal.com/#setup-lite) · the same shape as
this repo built against *your* API is [MCP Basic $199](https://kit.sdvsignal.com/#mcp-basic).

## 60-second start — no API key, no network, no Claude

```bash
git clone https://github.com/sdvsignal/kit-one-tool-mcp
cd kit-one-tool-mcp && npm install && npm test
```

15 tests, all offline. Three of them stand up a real MCP client against the real server over an
in-memory transport and call the tool, so the wiring is tested, not just the function. If those pass,
the server works — you have not needed a key yet.

## Add it to Claude Code

**Today, this is the one that works.** Clone it first, then point Claude Code at the local file:

```bash
git clone https://github.com/sdvsignal/kit-one-tool-mcp
cd kit-one-tool-mcp && npm install
export THING_API_KEY=...
claude mcp add kit-one-tool -- node "$PWD/src/index.js"
```

Or by hand in `.mcp.json`, using the absolute path to where you cloned it:

```json
{
  "mcpServers": {
    "kit-one-tool": {
      "command": "node",
      "args": ["/absolute/path/to/kit-one-tool-mcp/src/index.js"],
      "env": { "THING_API_KEY": "..." }
    }
  }
}
```

### Once it is on npm

`@sdvsignal/kit-one-tool-mcp` is **not published yet**, so the two commands below will fail with a
404 if you try them today. They are here so you know what the install becomes, not so you can run
it now:

```bash
claude mcp add kit-one-tool-mcp -- npx -y @sdvsignal/kit-one-tool-mcp
```

```json
{ "mcpServers": { "kit-one-tool-mcp": { "command": "npx", "args": ["-y", "@sdvsignal/kit-one-tool-mcp"] } } }
```

Registry name: `io.github.sdvsignal/kit-one-tool-mcp` (see `server.json`).

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

## Run it in a container

Same one tool, same stdio, nothing listening on a port:

```
docker build -t one-tool-mcp .
docker run --rm -i -e THING_API_KEY=... one-tool-mcp
```

`-i` matters — the server talks over stdin/stdout, so without it there is nothing to talk to. To
point Claude Desktop at the image instead of at node, use `"command": "docker"` with
`"args": ["run", "--rm", "-i", "-e", "THING_API_KEY", "one-tool-mcp"]`.

## Smoke prompt

Type this to Claude. This is the test that it is really wired up:

> Search THING for "onboarding" and show me the top 3.

You should get up to 3 results with names and ids. If nothing matches you get `No THINGs matched "onboarding"`, which is correct and not a failure. Telling the model that an empty result is empty is most of why it stops retrying.

## What is in here

| File | What it is |
|---|---|
| `src/search-things.js` | The one tool. Takes its dependencies as an argument, which is why it is testable without a key. |
| `src/server.js` | Server wiring. Registers exactly one tool. |
| `src/index.js` | The entrypoint. Connects stdio and nothing else. |
| `test/` | The 15 tests above. |
| `Dockerfile` | Builds the image above. Copies the lockfile and `src/`, runs `npm ci --omit=dev`. |

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

## Remove it

```bash
claude mcp remove one-tool
```

Claude Desktop: delete the `one-tool` block and restart. The server keeps no state, so nothing is left behind.

## Making it yours

1. Rename `search_things` for what it actually does, from the caller's point of view.
2. Write the input schema before the implementation. Every field described, required vs optional explicit.
3. Keep the description aimed at the model: say **when** to reach for the tool, not only what it is.
4. Point `THING_BASE_URL` and the auth header at the real API.
5. Run `npm test`, then run the smoke prompt in Claude. A passing test is not proof the tool works against the real API.

## You did not want to build one, you wanted eight wired

Half the people who land here from an MCP directory are not building a server — they want the
common ones *connected*, and they hit the same wall every time, which is the JSON rather than the
server.

**[MCP Config Pack — $49](https://buy.stripe.com/aFaeVfcsf0fc1v42sVf3a08?client_reference_id=from-gh-one-tool-mcp)** is eight ready configs (filesystem,
GitHub, Postgres, context7 and four more), each with the smoke prompt and the pass condition that
tells you it is actually connected rather than merely listed. Offline, no telemetry, instant
download. Two of the eight need no token at all, so you can prove the wiring before you go near a
credential.

Details and the full list: [kit.sdvsignal.com/#mcp-config-pack](https://kit.sdvsignal.com/#mcp-config-pack?utm_source=github&utm_medium=organic&utm_campaign=afm-find&utm_content=gh-readme-kit-one-tool-mcp-49).
If you would rather have them wired *into your repo* alongside hooks and skills, that is
[Setup Sprint $99](https://kit.sdvsignal.com/#setup-sprint), not this.

## Free here vs. paid

**This repo is MIT and complete** — the tool, the tests, the error table, the removal path. Nothing
is held back. If you are building your own MCP server, take it and go.

Paid is the same shape built against *your* API and tested against it before delivery, which is the
part the offline tests above deliberately cannot do: **MCP Basic $199** — one tool, the schema,
handoff notes, a smoke prompt and the enable/disable path. Need more than one tool, or a Worker?
**Build Packet $399.** Just want the repo itself set up for Claude Code first? **Setup Lite $29**
(back as a PR in 24h) or **Setup Sprint $99** (48h). Just want other people's servers connected?
**MCP Config Pack $49**, above.

Shipping an iOS app on top of it? **Preview Pack $149** is one App Store preview video to Apple's
spec, 5 stills and 2 revision rounds, in 72 hours.

**→ Scope and order: [kit.sdvsignal.com](https://kit.sdvsignal.com/?utm_source=github&utm_medium=organic&utm_campaign=afm-find&utm_content=gh-readme-kit-one-tool-mcp)**

We use AI tools including Claude; a person reviews every deliverable before it ships.
Independent project, not affiliated with Anthropic.

## Questions

Writing your first tool description, or want a second read of one? Paste it in
[Discussions](https://github.com/sdvsignal/kit-one-tool-mcp/discussions/1). Real answers, no signup.

## Related

- [kit-claude-code-starter](https://github.com/sdvsignal/kit-claude-code-starter) — the full Claude Code setup (CLAUDE.md, allowlist, 3 skills), free
- [kit-plugins](https://github.com/sdvsignal/kit-plugins) — the same skills as installable Claude Code plugins
- [kit-ios-worker-template](https://github.com/sdvsignal/kit-ios-worker-template) — StoreKit 2 verification on a Cloudflare Worker, with failure logging

## License

MIT licensed. Use it for your own work, no attribution needed.
