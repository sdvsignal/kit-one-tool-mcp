// Server wiring. One tool. A second tool is a Build Packet, not a bigger version of this.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TOOL_NAME, TOOL_CONFIG, makeSearchThings } from './search-things.js';

export function createServer(deps = {}) {
  const server = new McpServer({ name: 'one-tool-mcp', version: '0.1.0' });
  server.registerTool(TOOL_NAME, TOOL_CONFIG, makeSearchThings(deps));
  return server;
}
