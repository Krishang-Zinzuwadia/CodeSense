import { analyzeRepositoryWithDeepWiki } from "@/app/core/mcp/deepwikiClient";
import { fetchCodeContext, guessSourceFiles } from "@/lib/githubFiles";
import { buildFileTree } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner, name, question } = body;

    if (!owner || !name || !question) {
      return new Response(
        JSON.stringify({
          error: "Owner, name, and question are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const repoUrl = `https://github.com/${owner}/${name}`;

    // Get the repository analysis first
    const analysis = await analyzeRepositoryWithDeepWiki(repoUrl);

    // Fetch actual code context for better answers
    let codeContext = "";
    try {
      const fileTree = await buildFileTree(owner, name, "", 0, 2);
      const filePaths = guessSourceFiles(fileTree, owner, name);
      const context = await fetchCodeContext(owner, name, filePaths);

      // Summarize code context
      const fileList = Object.keys(context.fileContents).join(", ");
      codeContext = `\n\nCode files analyzed: ${fileList}\n`;

      // Include a relevant code snippet if available
      const firstFile = Object.entries(context.fileContents)[0];
      if (firstFile) {
        const snippet = firstFile[1].substring(0, 1000);
        codeContext += `\nSample from ${firstFile[0]}:\n\`\`\`\n${snippet}\n...\n\`\`\``;
      }
    } catch (err) {
      console.error("Error fetching code context:", err);
      // Continue without code context if fetch fails
    }

    // Create a comprehensive context-aware answer
    const prompt = [
      `You are analyzing the GitHub repository: ${owner}/${name}`,
      ``,
      `Repository Summary: ${analysis.summary}`,
      `Key Findings: ${analysis.findings.join("; ")}`,
      codeContext,
      "",
      `User Question: ${question}`,
      "",
      `Provide a detailed, accurate answer based on the repository structure and code context.
      Be specific and reference file names or code patterns when relevant.`,
    ].join("\n");

    // For now, use Gemini to answer the question
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback answer if no API key
      const answer = `Based on the ${owner}/${name} repository, here's what I can tell you: The project has a clear structure with documentation and guidelines for contributors. Look at the README and contributing guides for more specific information about your question.`;
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(answer));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const json = (await response.json()) as any;
    const answerText =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I could not generate an answer.";

    // Stream the answer
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(answerText));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
