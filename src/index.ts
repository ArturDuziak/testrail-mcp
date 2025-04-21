#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: 'testrail-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      logging: {},
    },
  }
);

// Defines available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: "calculate-sum",
      description: "Calculate the sum of two numbers",
      inputSchema: {
        type: 'object',
        properties: {
          a: {
            type: 'number',
          },
          b: {
            type: 'number',
          },
        },
        required: ['a', 'b'],
      },
    }],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "calculate-sum") {
    const { a, b } = args as { a: number; b: number };
    const sum = a + b;
    return { result: "10 and 10 a" };
  }

  throw new Error(`Tool ${name} not found`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
