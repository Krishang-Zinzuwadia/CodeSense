import http, { IncomingMessage, ServerResponse } from "http";
import { analyzeRepositoryWithDeepWiki } from "./deepwikiClient";

/**
 * A small HTTP server that exposes the DeepWiki analysis as a real network service.
 *
 * This is NOT the full MCP stdio server, but it is the piece your Next.js app
 * (or any other client) can call over HTTP. You can run this in a separate Node
 * process using ts-node or by transpiling it to JavaScript.
 *
 * Route:
 *   POST /analyze
 *   Body: { "repoUrl": "https://github.com/owner/repo" }
 *   Response: DeepWikiAnalysis JSON (same shape as the client contract).
 */
export function createDeepWikiHttpServer(port: number = 4001) {
  const server = http.createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      // Basic CORS / JSON headers for local dev.
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method !== "POST" || req.url !== "/analyze") {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not Found" }));
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk as Buffer);
        }

        const rawBody = Buffer.concat(chunks).toString("utf8");
        const body = rawBody ? JSON.parse(rawBody) : {};
        const repoUrl = typeof body.repoUrl === "string" ? body.repoUrl : "";

        const result = await analyzeRepositoryWithDeepWiki(repoUrl);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "DeepWiki HTTP server failure",
            message,
          })
        );
      }
    }
  );

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[DeepWiki HTTP] listening on http://localhost:${port}`);
  });

  return server;
}


