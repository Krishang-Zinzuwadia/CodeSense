import { fetchCodeContext, guessSourceFiles } from "@/lib/githubFiles";
import { buildFileTree } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner, name, filePaths } = body;

    if (!owner || !name) {
      return new Response(
        JSON.stringify({ error: "Owner and name are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // If no specific files requested, guess based on structure
    let pathsToFetch = filePaths || [];

    if (pathsToFetch.length === 0) {
      // Build file tree to analyze structure
      const fileTree = await buildFileTree(owner, name, "", 0, 2);

      // Guess likely source files
      pathsToFetch = guessSourceFiles(fileTree, owner, name);
    }

    // Fetch the code context
    const codeContext = await fetchCodeContext(owner, name, pathsToFetch);

    return new Response(JSON.stringify(codeContext), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
