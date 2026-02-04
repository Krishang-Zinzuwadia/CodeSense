"use strict";
// Standalone DeepWiki MCP server.
// Assumptions and design notes are explained in comments throughout this file.
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@modelcontextprotocol/sdk/server");
const stdio_1 = require("@modelcontextprotocol/sdk/server/stdio");
const types_1 = require("@modelcontextprotocol/sdk/types");
// Create the MCP server instance with basic metadata.
const server = new server_1.Server({
    name: "deepwiki-mcp-server",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Register available tools.
server.setRequestHandler(types_1.ListToolsRequestSchema, async () => {
    const tools = [
        {
            name: "deepwiki.analyzeRepo",
            description: "Analyze a GitHub repository URL and return a stubbed DeepWiki-style summary.",
            inputSchema: {
                type: "object",
                properties: {
                    repoUrl: {
                        type: "string",
                        description: "GitHub repository URL, e.g. https://github.com/owner/repo",
                    },
                },
                required: ["repoUrl"],
                additionalProperties: false,
            },
        },
    ];
    return { tools };
});
// Small helper that calls the Gemini API to get a real summary.
async function analyzeWithGemini(repoUrl) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in the environment.");
    }
    // Prompt keeps things focused on high‑level structure and contribution ideas.
    const prompt = [
        "You are helping a developer understand a GitHub repository and plan contributions.",
        `Repository URL: ${repoUrl}`,
        "",
        "Without cloning the repo, infer likely structure and contribution paths from the URL and common project patterns.",
        "Return a short summary (2–3 sentences) and 3–5 concise bullet points of concrete contribution ideas.",
    ].join("\n");
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" +
        encodeURIComponent(apiKey), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        }),
    });
    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }
    const json = (await response.json());
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "Gemini did not return any content.";
    // Very light post‑processing: first paragraph as summary, bullet‑like lines as findings.
    const lines = text.split("\n").map((line) => line.trim());
    const nonEmpty = lines.filter(Boolean);
    const summary = nonEmpty[0] ?? "No summary generated.";
    const findings = nonEmpty
        .slice(1)
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^[\-*]\s*/, "")) || [];
    return {
        repoUrl,
        summary,
        findings,
    };
}
// Handle tool invocations.
server.setRequestHandler(types_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    if (name !== "deepwiki.analyzeRepo") {
        throw new Error(`Unknown tool: ${name}`);
    }
    const args = (rawArgs ?? {});
    const repoUrl = typeof args.repoUrl === "string" ? args.repoUrl.trim() : "";
    // Basic validation: required field and simple URL shape check.
    if (!repoUrl) {
        throw new Error("repoUrl is required and must be a non-empty string.");
    }
    if (!/^https?:\/\/.+/i.test(repoUrl)) {
        throw new Error("repoUrl must be an absolute URL starting with http or https.");
    }
    let output;
    try {
        // Primary path: call Gemini for a real model-generated analysis.
        output = await analyzeWithGemini(repoUrl);
    }
    catch (error) {
        // If anything goes wrong with Gemini, fall back to a safe stub so the tool
        // never fails catastrophically for the caller.
        const message = error instanceof Error ? error.message : "Unknown Gemini error";
        output = {
            repoUrl,
            summary: "Gemini-backed analysis is temporarily unavailable; this is a static fallback summary.",
            findings: [
                "Check the README and docs directory to understand the project goals and architecture.",
                "Look for open issues labeled 'good first issue' or 'help wanted' as entry points.",
                "Review test coverage and consider adding or improving tests for core modules.",
                `Internal note: Gemini error was "${message}".`,
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(output, null, 2),
            },
        ],
    };
});
// Connect the server to stdio so MCP clients can communicate with it.
async function main() {
    const transport = new stdio_1.StdioServerTransport();
    await server.connect(transport);
    // Logging to stderr so it does not interfere with stdio protocol messages.
    // eslint-disable-next-line no-console
    console.error("[deepwiki-mcp-server] ready on stdio");
}
main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error("[deepwiki-mcp-server] fatal error", error);
    process.exit(1);
});
