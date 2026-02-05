import { analyzeRepositoryWithDeepWiki } from "@/app/core/mcp/deepwikiClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner, name, repoUrl } = body;

    // Support both owner/name format (from /repo page) and repoUrl format (from /core page)
    let effectiveRepoUrl = repoUrl;
    if (!effectiveRepoUrl && owner && name) {
      effectiveRepoUrl = `https://github.com/${owner}/${name}`;
    }

    if (!effectiveRepoUrl) {
      return new Response(
        JSON.stringify({ error: "Repository URL or owner/name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const analysis = await analyzeRepositoryWithDeepWiki(effectiveRepoUrl);

    // Stream the analysis text with Server-Sent Events
    let content = analysis.summary + "\n\n";
    if (analysis.findings.length > 0) {
      content += "## Key Findings\n\n";
      content += analysis.findings.map((f) => `- ${f}`).join("\n");
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(content));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
