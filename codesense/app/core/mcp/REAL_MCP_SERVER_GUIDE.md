## DeepWiki MCP – Turning the Stub into a Real MCP Server

This document explains how to replace the local stub in `app/core/mcp/deepwikiClient.ts` with a real DeepWiki MCP server + client setup, while keeping the UI and core intelligence cleanly separated.

> **Important:** The code below is illustrative. Keep it outside of your Next.js `app/` import graph (or in a separate project) so it does not affect your Next.js build unless you intentionally wire it in.

---

### 1. Keep the Client Contract Stable (What the App Expects)

The Next.js app currently imports:

```ts
// app/core/mcp/deepwikiClient.ts
export type DeepWikiAnalysis = {
  repoUrl: string;
  summary: string;
  findings: string[];
  stub: true;
};

export async function analyzeRepositoryWithDeepWiki(
  repoUrl: string
): Promise<DeepWikiAnalysis> {
  // Stub implementation...
}
```

When you move to a real MCP-backed client, you should:

- Keep the **function name** the same (`analyzeRepositoryWithDeepWiki`).
- Keep the **input** the same (`repoUrl: string`).
- Extend the **output type** if needed, but avoid breaking existing fields so the rest of the app keeps working.

---

### 2. Create a Dedicated DeepWiki MCP Server (Separate Process)

In a separate folder (for example, `deepwiki-mcp-server/` outside `app/`), you can create a Node-based MCP server.

1. **Initialize the project:**

```bash
mkdir deepwiki-mcp-server
cd deepwiki-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk node-fetch
```

2. **Create a minimal MCP server (e.g. `server.ts`):**

```ts
// server.ts
import { createServer, Tool, StdioServerTransport } from "@modelcontextprotocol/sdk/server";
import fetch from "node-fetch";

type DeepWikiResult = {
  repoUrl: string;
  summary: string;
  findings: string[];
};

const analyzeRepoTool: Tool = {
  name: "deepwiki.analyzeRepo",
  description: "Analyze a GitHub repository using DeepWiki and return a structured summary.",
  inputSchema: {
    type: "object",
    properties: {
      repoUrl: { type: "string", description: "GitHub repository URL" },
    },
    required: ["repoUrl"],
  },
  async execute(input) {
    const repoUrl = String(input.repoUrl ?? "").trim();
    if (!repoUrl) {
      throw new Error("repoUrl is required");
    }

    // TODO: Replace this with the real DeepWiki HTTP/MCP integration.
    // For now, call DeepWiki (or your own backend) here.
    const result: DeepWikiResult = {
      repoUrl,
      summary: "Real DeepWiki summary would go here.",
      findings: [
        "Key components identified from the repository.",
        "Documentation and onboarding quality assessment.",
        "Potential areas for GSoC-style contributions.",
      ],
    };

    return result;
  },
};

async function main() {
  const server = createServer(
    {
      name: "codesense-deepwiki-mcp",
      version: "0.0.1",
      description: "DeepWiki-backed analysis tools for CodeSense.",
      tools: [analyzeRepoTool],
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("DeepWiki MCP server failed:", err);
  process.exit(1);
});
```

3. **Add a start script to `deepwiki-mcp-server/package.json`:**

```json
{
  "scripts": {
    "start": "ts-node server.ts"
  }
}
```

You can then run:

```bash
npm run start
```

Your IDE or orchestrator (e.g. Claude Desktop, Cursor MCP config, etc.) can register this server as an MCP endpoint.

> If you prefer a simple HTTP server instead of stdio while you’re iterating, you can reuse the helper in `app/core/mcp/deepwikiHttpServer.ts` and create a tiny entrypoint that calls `createDeepWikiHttpServer(4001)`.

---

### 3. Connect the Next.js App to the MCP Server

The Next.js app should **not** talk MCP over stdio directly; instead, expose a simple HTTP interface or use your IDE’s MCP runtime to call the tool and forward the response.

For a simple HTTP bridge (implemented outside of `app/` to avoid tight coupling):

1. Create a small Node service (`deepwiki-bridge`) that:
   - Accepts `POST /analyze` with `{ repoUrl }`.
   - Uses the MCP client SDK to call the `deepwiki.analyzeRepo` tool.
   - Returns the JSON result to the caller.

2. Update `analyzeRepositoryWithDeepWiki` to call that bridge:

```ts
// app/core/mcp/deepwikiClient.ts
export async function analyzeRepositoryWithDeepWiki(
  repoUrl: string
): Promise<DeepWikiAnalysis> {
  const trimmedUrl = repoUrl.trim();
  if (!trimmedUrl) {
    throw new Error("Repository URL is required for DeepWiki analysis.");
  }

  // In production, point this to your real bridge or DeepWiki endpoint.
  const res = await fetch(process.env.DEEPWIKI_MCP_HTTP_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl: trimmedUrl }),
  });

  if (!res.ok) {
    throw new Error(`DeepWiki MCP HTTP bridge failed (${res.status})`);
  }

  const json = await res.json();

  return {
    repoUrl: json.repoUrl ?? trimmedUrl,
    summary: json.summary ?? "No summary returned.",
    findings: Array.isArray(json.findings) ? json.findings : [],
    // Keep stub: true for now so the rest of the app compiles;
    // you can later evolve this type once the integration is stable.
    stub: true,
  };
}
```

> You can keep the current stub implementation for local development and switch to the HTTP-backed version only when `DEEPWIKI_MCP_HTTP_URL` is set.

---

### 4. Safe Migration Strategy

1. **Phase 1 – Stub only (current state):**
   - No external services.
   - `/core` route renders sample JSON from the stub.

2. **Phase 2 – Hidden MCP integration:**
   - Stand up the MCP server and HTTP bridge.
   - Behind an env flag, have `analyzeRepositoryWithDeepWiki` call the HTTP bridge instead of the stub.

3. **Phase 3 – Full DeepWiki features:**
   - Enrich the `DeepWikiAnalysis` type (e.g. add `gsocIdeas`, `architectureDiagram`, etc.).
   - Expand the UI in `app/core` (e.g. `chat/` and `agent/` folders) to render summaries, recommendations, and diagrams.

Throughout all phases, keep:

- The **MCP server** decoupled from the **Next.js app**.
- The **client contract** (`analyzeRepositoryWithDeepWiki`) stable, so UI changes stay minimal.


