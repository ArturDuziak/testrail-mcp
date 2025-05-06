#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

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

const makeTestrailRequest = async (path: string, method: string, body: Record<string, string | number | boolean>) => {
  const response = await fetch(`${process.env.TESTRAIL_BASE_URL}/index.php?/api/v2/${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${process.env.TESTRAIL_USERNAME}:${process.env.TESTRAIL_API_KEY}`).toString('base64')}`,
    }
  });

  return response.json();
}

// Defines available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: 'add-project',
      description: 'Adds new TestRail project',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the project'
          },
          show_announcement: {
            type: 'boolean',
            description: 'True if the announcement should be displayed on the project’s overview page and false otherwise'
          },
          announcement: {
            type: 'string',
            description: 'The description/announcement of the project'
          },
          suite_mode: {
            type: 'number',
            description: 'The suite mode of the project (1 for single suite mode, 2 for single suite + baselines, 3 for multiple suites)'
          }
        },
        required: ['name'],
      },
    },
    {
      name: 'delete-project',
      description: 'Deletes a TestRail project',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'The ID of the project to delete'
          }
        },
        required: ['id'],
      }
    }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'add-project': {
      const addArgs = args as { name: string, show_announcement?: boolean, announcement?: string, suite_mode?: number };

      const addResponse = await makeTestrailRequest('add_project', 'POST', addArgs);

      return {
        content: [
          {
            type: 'text',
            text: 'Response details: ' + JSON.stringify(addResponse)
          }
        ]
      }
    }
    case 'delete-project': {
      const deleteArgs = args as { id: number };

      const deleteResponse = await makeTestrailRequest(`delete_project/${deleteArgs.id}`, 'POST', {});

      return {
        content: [
          {
            type: 'text',
            text: 'Response details: ' + (deleteResponse ?? JSON.stringify(deleteResponse))
          }
        ]
      }
    }
    default:
      throw new Error(`Tool ${name} not found`);
  }
});

async function runSSEServer() {
  if (!process.env.TESTRAIL_BASE_URL || !process.env.TESTRAIL_USERNAME || !process.env.TESTRAIL_API_KEY) {
    throw new Error('TESTRAIL_BASE_URL, TESTRAIL_USERNAME and TESTRAIL_API_KEY must be set');
  }

  let transport: SSEServerTransport | null = null;

  const app = express();

  app.get('/sse', (req, res) => {
    transport = new SSEServerTransport('/messages', res);
    server.connect(transport);
  });

  app.post('/messages', (req, res) => {
    if (transport) {
      transport.handlePostMessage(req, res)
    }
  })

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

await runSSEServer();
