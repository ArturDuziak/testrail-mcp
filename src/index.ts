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

const makePostTestrailRequest = async (path: string, body: Record<string, string | number | boolean>) => {
  const response = await fetch(`${process.env.TESTRAIL_BASE_URL}/index.php?/api/v2/${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${process.env.TESTRAIL_USERNAME}:${process.env.TESTRAIL_API_KEY}`).toString('base64')}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to make TestRail request: ${response.statusText}`);
  }

  return response.json();
}

const makeGetTestrailRequest = async (path: string, params: Record<string, string | number | boolean>) => {
  const stringParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    stringParams[key] = String(value);
  });
  
  const queryParams = new URLSearchParams(stringParams);
  const queryString = queryParams.toString();
  const url = `${process.env.TESTRAIL_BASE_URL}/index.php?/api/v2/${path}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${process.env.TESTRAIL_USERNAME}:${process.env.TESTRAIL_API_KEY}`).toString('base64')}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to make TestRail request: ${response.statusText}`);
  }

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
    },
    {
      name: 'update-project',
      description: 'Updates a TestRail project',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'The ID of the project to update'
          },
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
        required: ['id', 'name'],
      }
    },
    {
      name: 'get-projects',
      description: 'Returns the list of available TestRail projects.',
      inputSchema: {
        type: 'object',
        properties: {
          is_completed: {
            type: 'number',
            description: '1 to return completed projects only. 0 to return active projects only'
          },
          limit: {
            type: 'number',
            description: 'The number of projects the response should return (The response size is 250 by default)'
          },
          offset: {
            type: 'number',
            description: 'Where to start counting the projects from (the offset)'
          }
        },
        required: [],
      }
    },
    {
      name: 'get-project',
      description: 'Returns given TestRail project.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: '	The ID of the project'
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
    case 'get-projects': {
      const getProjectsArgs = args as { is_completed?: number, limit?: number, offset?: number };

      const getProjectsResponse = await makeGetTestrailRequest('get_projects', getProjectsArgs);

      return {
        content: [
          {
            type: 'text',
            text: 'Response details: ' + JSON.stringify(getProjectsResponse)
          }
        ]
      }
    }
    case 'get-project': {
      const getProjectArgs = args as { id: number };

      const getProjectResponse = await makeGetTestrailRequest(`get_project/${getProjectArgs.id}`, {});

      return {
        content: [
          {
            type: 'text',
            text: 'Response details: ' + JSON.stringify(getProjectResponse)
          }
        ]
      }
    }
    case 'add-project': {
      const addArgs = args as { name: string, show_announcement?: boolean, announcement?: string, suite_mode?: number };

      const addResponse = await makePostTestrailRequest('add_project', addArgs);

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

      const deleteResponse = await makePostTestrailRequest(`delete_project/${deleteArgs.id}`, {});

      return {
        content: [
          {
            type: 'text',
            text: 'Response details: ' + (deleteResponse ?? JSON.stringify(deleteResponse))
          }
        ]
      }
    }
    case 'update-project': {
      const updateArgs = args as { id: number, name: string, show_announcement?: boolean, announcement?: string, suite_mode?: number };

      const updateResponse = await makePostTestrailRequest(`update_project/${updateArgs.id}`, updateArgs);
      
      return {
        content: [
          {
            type: 'text',
            text: 'Response details: ' + JSON.stringify(updateResponse)
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
