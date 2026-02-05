import { buildFileTree, getKeyFiles } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner, name } = body;

    if (!owner || !name) {
      return new Response(
        JSON.stringify({ error: "Owner and name are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let fileTree = [];
    let keyFiles = [];
    let error = null;

    // Try to build the file tree, but don't fail if it errors
    try {
      fileTree = await buildFileTree(owner, name, "", 0, 3);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      console.warn(`[FileStructure] Failed to build tree: ${errMsg}`);
      error = errMsg;
    }

    // Try to get key files, but don't fail if it errors
    try {
      keyFiles = await getKeyFiles(owner, name);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Unknown error";
      console.warn(`[FileStructure] Failed to get key files: ${errMsg}`);
    }

    const structure = {
      title: `${owner}/${name}`,
      fileTree: fileTree || [],
      keyFiles: keyFiles || [],
      stats: {
        totalItems: fileTree ? countItems(fileTree) : 0,
        depth: 3,
      },
      error: error || null,
    };

    return new Response(JSON.stringify(structure), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[FileStructure API Error]", message);
    return new Response(
      JSON.stringify({
        error: message,
        fileTree: [],
        keyFiles: [],
        stats: { totalItems: 0, depth: 3 },
      }),
      {
        status: 200, // Return 200 but with empty data
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

function countItems(tree: any[]): number {
  let count = 0;
  for (const item of tree) {
    count++;
    if (item.children) {
      count += countItems(item.children);
    }
  }
  return count;
}
