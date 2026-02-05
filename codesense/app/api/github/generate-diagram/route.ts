import { generateDiagramWithGemini } from "@/lib/diagramGenerator";
import { buildFileTree } from "@/lib/github";
import { fetchCodeContext, guessSourceFiles } from "@/lib/githubFiles";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner, name, diagramType = "architecture" } = body;

    if (!owner || !name) {
      return new Response(
        JSON.stringify({ error: "Owner and name are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch file structure
    const fileTree = await buildFileTree(owner, name, "", 0, 2);

    // Fetch code context
    const filePaths = guessSourceFiles(fileTree, owner, name);
    const codeContext = await fetchCodeContext(owner, name, filePaths);

    // Format file structure for analysis
    const fileStructureStr = JSON.stringify(fileTree, null, 2).substring(0, 2000);

    // Format code context for analysis
    const codeContextStr = Object.entries(codeContext.fileContents)
      .slice(0, 3)
      .map(([path, content]) => `\n${path}:\n${content.substring(0, 500)}`)
      .join("\n");

    // Generate diagram
    const diagram = await generateDiagramWithGemini(
      owner,
      name,
      fileStructureStr,
      codeContextStr,
      diagramType
    );

    return new Response(
      JSON.stringify({
        diagram,
        type: diagramType,
        repository: `${owner}/${name}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
