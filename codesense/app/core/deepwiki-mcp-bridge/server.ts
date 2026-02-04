// Minimal HTTP bridge for a DeepWiki MCP server.
// This service:
// - exposes POST /analyze
// - accepts { repoUrl: string } as JSON
// - calls the "deepwiki.analyzeRepo" MCP tool over stdio
// - returns the JSON result directly
// Assumptions and configuration are documented in comments only.

import http, { IncomingMessage, ServerResponse } from "http";
import { spawn } from "child_process";
import {
  Client,
  StdioClientTransport,
} from "@modelcontextprotocol/sdk/client"; // resolved via NodeNext module resolution
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types";

// Environment-driven configuration so this bridge stays generic.
const MCP_COMMAND = process.env.MCP_SERVER_COMMAND ?? "node";
const MCP_COMMAND_ARGS = process.env.MCP_SERVER_ARGS
  ? JSON.parse(process.env.MCP_SERVER_ARGS)
  : ["dist/server.js"];
const BRIDGE_PORT = Number(process.env.BRIDGE_PORT ?? "4002");
const BRIDGE_HOST = process.env.BRIDGE_HOST ?? "127.0.0.1";

async function callDeepwikiAnalyzeRepo(repoUrl: string) {
  const child = spawn(MCP_COMMAND, MCP_COMMAND_ARGS, {
    stdio: "pipe",
  });

  const transport = new StdioClientTransport({
    stdin: child.stdin,
    stdout: child.stdout,
  });

  const client = new Client(
    {
      name: "deepwiki-mcp-bridge",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  await client.connect(transport);

  // Optional: ensure the tool exists (can be skipped for perf once stable).
  await client.request(ListToolsRequestSchema, {});

  const response = await client.request(CallToolRequestSchema, {
    name: "deepwiki.analyzeRepo",
    arguments: { repoUrl },
  });

  // Basic extraction: we expect the MCP server to return text content that is JSON.
  const first = response.content?.[0];
  if (!first || first.type !== "text") {
    throw new Error("Unexpected MCP response format; expected text content.");
  }

  try {
    return JSON.parse(first.text);
  } finally {
    child.kill();
  }
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== "POST" || req.url !== "/analyze") {
      sendJson(res, 404, { error: "Not Found" });
      return;
    }

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }

      const rawBody = Buffer.concat(chunks).toString("utf8");
      const body = rawBody ? JSON.parse(rawBody) : {};
      const repoUrl = typeof body.repoUrl === "string" ? body.repoUrl.trim() : "";

      if (!repoUrl) {
        sendJson(res, 400, {
          error: "InvalidRequest",
          message: "repoUrl is required and must be a non-empty string.",
        });
        return;
      }

      const result = await callDeepwikiAnalyzeRepo(repoUrl);
      sendJson(res, 200, result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      sendJson(res, 500, {
        error: "BridgeError",
        message,
      });
    }
  }
);

server.listen(BRIDGE_PORT, BRIDGE_HOST, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[deepwiki-mcp-bridge] listening on http://${BRIDGE_HOST}:${BRIDGE_PORT}`
  );
});


