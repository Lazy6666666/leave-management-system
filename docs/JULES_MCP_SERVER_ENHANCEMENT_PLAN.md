# Jules MCP Server Enhancement Plan: Custom Prompts

## 1. Overview

This document outlines the plan to enhance the existing Jules MCP server to support and manage custom command prompts. The goal is to make these prompts available as dynamic tools within the MCP framework, improving flexibility and user experience.

## 2. Current State

The existing [`jules-server`](../../Documents/Cline/MCP/jules-server/src/jules-server/index.ts:1) provides two core tools:
*   `link_repo`: Links a GitHub repository to Jules.
*   `implement`: Sends a generic prompt to the Jules API's `/implement` endpoint.

The server uses the `@modelcontextprotocol/sdk` and `axios` for communication with the `https://jules.googleapis.com/v1alpha` endpoint, authenticated via the `JULES_API_KEY` environment variable.

## 3. Architectural Plan

### 3.1. Prompt Configuration File (`jules-prompts.json`)

A new JSON configuration file will be created at the root of the `jules-server` project: `jules-prompts.json`.

**File Location:** `../../Documents/Cline/MCP/jules-server/jules-prompts.json`

**Format:**
An array of prompt objects. Each object defines a custom tool.

```json
[
  {
    "name": "create_react_component",
    "description": "Generates a React component based on specifications.",
    "prompt_template": "Create a React component for a [component_type] that displays [data]. It should have the following styling: [styling_instructions].",
    "input_schema": {
      "type": "object",
      "properties": {
        "component_type": { "type": "string", "description": "Type of component (e.g., UserCard, ProductList)" },
        "data": { "type": "string", "description": "What data the component should display" },
        "styling_instructions": { "type": "string", "description": "Any specific CSS or styling requirements" }
      },
      "required": ["component_type", "data"]
    },
    "category": "Frontend"
  },
  {
    "name": "write_python_script",
    "description": "Writes a Python script to perform a specific task.",
    "prompt_template": "Write a Python script that [task_description]. Include error handling and comments.",
    "input_schema": {
      "type": "object",
      "properties": {
        "task_description": { "type": "string", "description": "A detailed description of the task the script should accomplish." }
      },
      "required": ["task_description"]
    },
    "category": "Backend"
  },
  {
    "name": "debug_echo_prompt",
    "description": "Returns the fully rendered prompt that would be sent to the Jules API for a given custom prompt tool and arguments. Does not call the Jules API. (Debug Tool)",
    "prompt_template": "Rendering prompt for tool: {tool_name} with arguments: {arguments_json}",
    "input_schema": {
      "type": "object",
      "properties": {
        "tool_name": { "type": "string", "description": "The name of the custom prompt tool (e.g., 'create_react_component')" },
        "arguments": { "type": "object", "description": "The arguments to be used for rendering the prompt template." }
      },
      "required": ["tool_name", "arguments"]
    },
    "category": "Debug"
  }
]
```

### 3.2. Dynamic Tool Registration

The MCP server ([`jules-server/index.ts`](../../Documents/Cline/MCP/jules-server/src/jules-server/index.ts:1)) will be modified as follows:

1.  **Import `fs` and `path`:** Add Node.js modules for file system operations.
    ```typescript
    import * as fs from 'fs';
    import * as path from 'path';
    ```
2.  **Prompt Loading Function:** Create a new function, `loadCustomPrompts()`, to:
    *   Read `jules-prompts.json`.
    *   Validate its structure against a JSON schema (see section 3.5).
    *   Parse the file into an array of prompt definitions.
    *   Return the array or an empty array if the file is not found or invalid, logging appropriate messages.
3.  **Server Initialization:**
    *   Call `loadCustomPrompts()` during server startup.
    *   Store the loaded prompts in a private class property (e.g., `this.customPrompts`).
4.  **`ListToolsRequestSchema` Handler Update:**
    *   The existing handler will be augmented.
    *   It will iterate over `this.customPrompts`.
    *   For each prompt, it will construct a tool definition object using the prompt's `name`, `description`, and `input_schema`.
    *   These dynamically generated tools will be added to the `tools` array returned by the handler.
    *   The `link_repo` and `implement` tools will remain as static definitions.
5.  **`CallToolRequestSchema` Handler Update:**
    *   The existing logic for `link_repo` and `implement` will be preserved.
    *   A new `else if` block will be added to check if `request.params.name` matches any of the `this.customPrompts`.
    *   If a match is found:
        *   Retrieve the corresponding prompt definition.
        *   Validate `request.params.arguments` against the prompt's `input_schema`. If invalid, throw an `McpError(ErrorCode.InvalidParams, ...)`.
        *   Render the `prompt_template` using the provided `arguments`. This can be done with a simple string replacement for placeholders like `[placeholder]` or a more robust templating library if complex logic is needed. For this plan, we'll assume simple placeholder replacement: `prompt_template.replace(/\[([^\]]+)\]/g, (match, key) => args[key] || match);`
        *   Send the rendered prompt to the Jules API's `/implement` endpoint, similar to the existing `implement` tool.
        *   Return the API response.
    *   If no match is found for any tool name, throw an `McpError(ErrorCode.MethodNotFound, ...)`.

### 3.3. Logging and Observability

To aid in development and debugging, the following logging and observability features will be implemented:

1.  **Logging Library:** Integrate `pino` for structured logging.
    *   Add `pino` to `package.json` dependencies.
    *   Create a logger instance: `import pino from 'pino'; const logger = pino({ level: process.env.JULES_LOG_LEVEL || 'info' });`
2.  **Log Output:**
    *   Logs will be written to the console.
    *   Optionally, to a file specified by `JULES_LOG_FILE` environment variable.
3.  **Log Content:**
    *   **Server Lifecycle:** `info` level logs for server start, stop, and prompt loading.
    *   **Prompt Loading:** `debug` level for successfully loaded prompts, `warn`/`error` for loading issues.
    *   **MCP Requests:** `debug` level for incoming `ListTools` and `CallTool` requests (arguments should be sanitized to avoid logging sensitive data).
    *   **Jules API Calls:** `debug` level for requests sent to Jules API (prompts) and responses received. Include latency.
    *   **Errors:** `error` level for all unhandled exceptions, with stack traces and relevant context.
4.  **`JULES_DEBUG_MODE` Environment Variable:**
    *   If set to `true` or `1`:
        *   Default log level will be set to `debug`.
        *   The `debug_echo_prompt` tool (defined in `jules-prompts.json`) will be included in the list of available tools.
5.  **Error Handling:**
    *   All file I/O, JSON parsing, and API calls will be wrapped in `try...catch` blocks.
    *   Errors will be logged with `logger.error()` and appropriate `McpError`s will be thrown to the MCP client.
    *   If `jules-prompts.json` is missing or invalid, the server will log a warning and start with only the built-in tools.

### 3.4. Prompt Template Handling

Prompt templates will use simple placeholder syntax. For example:
`"Create a [LANGUAGE] function named [FUNCTION_NAME] that [DESCRIPTION]."`

When a tool is called, the server will:
1.  Retrieve the `prompt_template` from the prompt definition.
2.  Take the `arguments` from the MCP tool call.
3.  Replace each placeholder `[KEY]` with the corresponding value from `arguments.KEY`.
    *   A simple implementation: `renderedPrompt = promptTemplate.replace(/\[([^\]]+)\]/g, (match, p1) => (args[p1] !== undefined ? args[p1] : match));`
    *   This basic replacement will be used initially. If more complex templating (e.g., conditionals, loops) is required later, a dedicated templating library like `mustache` or `handlebars` can be integrated.

### 3.5. Configuration Validation

A JSON schema will be defined to validate the `jules-prompts.json` file.

**Example Schema (simplified):**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "description": { "type": "string" },
      "prompt_template": { "type": "string" },
      "input_schema": { "type": "object" }, // Further validation for JSON Schema properties
      "category": { "type": "string" }
    },
    "required": ["name", "description", "prompt_template", "input_schema"]
  }
}
```

The `loadCustomPrompts()` function will use this schema (e.g., with a library like `ajv`) to validate each prompt definition. Invalid definitions will be skipped and logged.

## 4. Implementation Status

The following steps have been completed:
*   [x] **Update `package.json`:** Added `pino` and `ajv` to dependencies.
*   [x] **Create `jules-prompts.json`:** Created the configuration file with example prompts.
*   [x] **Modify `jules-server/index.ts`:**
    *   Imported necessary modules: `fs`, `path`, `pino`, `ajv`.
    *   Implemented the `loadCustomPrompts()` function with schema validation.
    *   Integrated the `pino` logger.
    *   Updated the server constructor to call `loadCustomPrompts()`.
    *   Modified the `ListToolsRequestSchema` handler to include dynamically loaded tools.
    *   Modified the `CallToolRequestSchema` handler to process custom prompt tools.
    *   Implemented the prompt rendering logic with placeholder replacement.
    *   Added comprehensive logging throughout, including for MCP requests and Jules API calls.
    *   Added helper methods for argument and prompt sanitization in logs.
    *   Ensured the `debug_echo_prompt` tool is functional.

## 5. How to Use

### 5.1. Setup

1.  **Navigate to the server directory:**
    ```bash
    cd ../../Documents/Cline/MCP/jules-server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set Environment Variables (Optional but Recommended):**
    *   `JULES_API_KEY`: Your Jules API key (required for the server to run).
    *   `JULES_DEBUG_MODE`: Set to `true` to enable debug-level logging and ensure the `debug_echo_prompt` tool is available.
        ```bash
        export JULES_DEBUG_MODE=true
        ```
    *   `JULES_LOG_LEVEL`: Set to `debug`, `info`, `warn`, or `error` (default is `info`, or `debug` if `JULES_DEBUG_MODE` is true).
    *   `JULES_LOG_FILE`: Path to a file where logs should be written (e.g., `./jules-server.log`).

### 5.2. Running the Server

*   **Development Mode (watches for file changes):**
    ```bash
    npm run dev
    ```
*   **Production Mode (builds the server first):**
    ```bash
    npm run build
    # Then run the built server:
    node build/jules-server/index.js
    ```

### 5.3. Using Custom Prompts with an MCP Client

Once the server is running, you can use an MCP client to interact with it.

1.  **List Available Tools:**
    Your MCP client should now list the built-in tools (`link_repo`, `implement`) plus any custom prompts defined in `jules-prompts.json`. If `JULES_DEBUG_MODE` is true, the `debug_echo_prompt` tool will also be listed.

2.  **Call a Custom Prompt Tool:**
    For example, to use the `create_react_component` prompt:
    *   **Tool Name:** `create_react_component`
    *   **Arguments:**
        ```json
        {
          "component_type": "UserProfileCard",
          "data": "user's name, avatar, and email address",
          "styling_instructions": "Use a card layout with a blue border and rounded corners."
        }
        ```
    The server will render this into a prompt and send it to the Jules API.

3.  **Using the `debug_echo_prompt` Tool:**
    This tool is useful for seeing the exact prompt that will be sent to the Jules API without actually sending it.
    *   **Tool Name:** `debug_echo_prompt`
    *   **Arguments:**
        ```json
        {
          "tool_name": "create_react_component",
          "arguments": {
            "component_type": "UserProfileCard",
            "data": "user's name, avatar, and email address",
            "styling_instructions": "Use a card layout with a blue border and rounded corners."
          }
        }
        ```
    The server will return the rendered prompt string.

### 5.4. Modifying Custom Prompts

Edit the [`jules-prompts.json`](../../Documents/Cline/MCP/jules-server/jules-prompts.json:1) file. The server will automatically pick up changes when it restarts or, in development mode, when the file is saved (due to `tsc --watch` recompiling, which will trigger a module reload if the server is set up for hot-reloading, or on the next restart if not). For immediate effect without a full server restart in dev mode, you might need to restart the `tsc --watch` process or ensure your dev setup supports hot-reloading of modules.

## 6. Testing (Post-Implementation)

1.  **Start the server:**
    ```bash
    cd ../../Documents/Cline/MCP/jules-server
    npm run dev
    ```
2.  **Use an MCP client to list tools** and verify that custom prompts appear.
3.  **Call custom prompt tools** with various valid and invalid arguments.
4.  **Verify that prompts are correctly rendered** and sent to the Jules API (check server logs).
5.  **Test the `debug_echo_prompt` tool.**
6.  **Test error conditions** (e.g., temporarily rename `jules-prompts.json`, provide invalid arguments to a tool).
7.  **Test with `JULES_DEBUG_MODE=true`** and observe increased log verbosity and the presence of the debug tool.

## 5. Future Enhancements

*   **Templating Engine:** If simple placeholder replacement is insufficient, integrate a more powerful templating engine.
*   **Prompt Categories UI:** If an MCP client supports UI, categories could be used to group tools.
*   **Remote Prompt Sources:** Allow loading prompts from a URL or other remote sources in addition to a local file.
*   **Prompt Versioning:** Implement versioning for prompts to allow rollbacks or A/B testing.
*   **Performance Monitoring:** Track and log the performance of Jules API calls to identify slow prompts.
*   **Caching:** Cache responses from the Jules API for identical prompts to reduce API calls and improve response time.

## 6. Security Considerations

*   **API Key Security:** The `JULES_API_KEY` must be kept secure and not hardcoded. The current environment variable approach is good.
*   **Input Sanitization:** While the MCP protocol should handle sanitization for its own communication, be cautious if logging raw user input from prompt arguments to avoid injection of malicious content into logs.
*   **Prompt Injection:** Be aware that custom prompts themselves could be designed to try and extract information or manipulate the Jules API in unintended ways if the Jules model is vulnerable to prompt injection. This is more a concern for the Jules API itself but something to be aware of.