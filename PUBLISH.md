# Publishing this to npm + the MCP Registry

Everything is staged. Both steps need a login only Dave can do, so neither is run by the unattended drain.

## 1. npm (needs an npm account + 2FA/OTP)

```bash
cd ~/estimatekit/kit-one-tool-mcp
npm login                 # OTP goes to Dave's device
npm publish --access public
```

`package.json` is already set: scoped name `@sdvsignal/kit-one-tool-mcp`, `"mcpName": "io.github.sdvsignal/kit-one-tool-mcp"`,
`files`, `bin`, `publishConfig.access=public`, `private` removed. `npm test` is 15/15 green.

## 2. MCP Registry (needs a GitHub device-flow login in a browser)

```bash
brew install mcp-publisher   # or the release binary from github.com/modelcontextprotocol/registry
cd ~/estimatekit/kit-one-tool-mcp
mcp-publisher login github   # opens a browser, Dave approves the sdvsignal namespace
mcp-publisher publish
```

`server.json` is already written and validates clean against the published
`2025-09-29/server.schema.json` (checked 2026-09-19). The namespace `io.github.sdvsignal/*` is authorised by the
GitHub login, which is why the login is the whole blocker.

## 3. Prove it

```bash
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.sdvsignal"
```

Today that returns `{"servers":[],"metadata":{"count":0}}`. After publishing it should name the server.
