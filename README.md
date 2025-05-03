# Testrail MCP server

## Description

A Model Context Protocol (MCP) server implementation for [Testrail](https://www.testrail.com/) that allows you to manage and automate your Testrail projects.

## Installation

1. Clone the repository
2. Install dependencies by running `pnpm install`
3. Create a `.env` based on `.env.example` file and set the `TESTRAIL_BASE_URL`, `TESTRAIL_USERNAME` and `TESTRAIL_API_KEY` variables (you can generate API key in Testrail in `My Settings > Authentication` section)

## Running the SSE server

After installing dependencies, you have to build the project by running `pnpm build` and then run the server by running `pnpm start`. Server will be available at `http://localhost:3000/sse`.

## Available Tools

### Add new project - `add-project`

Adds a new Testrail project with the given name.

```json
{
  "name": "Project X",
  "show_announcement": true,
  "announcement": "Welcome to project X",
  "suite_mode": 1
}
```

### Delete project - `delete-project`

Deletes a Testrail project with the given ID.

```json
{
  "id": 1
}
```
