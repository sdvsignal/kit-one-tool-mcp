#!/usr/bin/env node
// One-tool MCP server (Kit, MCP Basic $199). Replace THING with the real service.
// Credentials come from the environment. Never a literal, never a working default.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

await createServer().connect(new StdioServerTransport());
