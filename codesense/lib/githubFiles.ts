/**
 * Fetch file contents from GitHub
 * Used to get code context for analysis
 */

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;

    const response = await fetch(url, {
      headers: {
        ...(process.env.GITHUB_TOKEN && { Authorization: `token ${process.env.GITHUB_TOKEN}` }),
      },
    });

    if (!response.ok) {
      // Try master branch if main doesn't exist
      const urlMaster = `https://raw.githubusercontent.com/${owner}/${repo}/master/${path}`;
      const responseMaster = await fetch(urlMaster);

      if (!responseMaster.ok) {
        return null;
      }

      const text = await responseMaster.text();
      return text.length > 50000 ? text.substring(0, 50000) : text; // Limit to 50KB
    }

    const text = await response.text();
    return text.length > 50000 ? text.substring(0, 50000) : text;
  } catch (error) {
    console.error(`Error fetching file ${path}:`, error);
    return null;
  }
}

interface CodeContext {
  owner: string;
  repo: string;
  fileContents: {
    [path: string]: string;
  };
  summary: string;
}

// Fetch multiple key files for context
async function fetchCodeContext(owner: string, repo: string, filePaths: string[]): Promise<CodeContext> {
  const fileContents: { [key: string]: string } = {};
  let totalSize = 0;

  for (const path of filePaths) {
    const content = await fetchFileContent(owner, repo, path);
    if (content) {
      fileContents[path] = content;
      totalSize += content.length;

      // Stop if we've collected enough context (500KB)
      if (totalSize > 500000) break;
    }
  }

  const summary = `Fetched ${Object.keys(fileContents).length} files (${Math.round(totalSize / 1024)}KB total)`;

  return {
    owner,
    repo,
    fileContents,
    summary,
  };
}

// Helper to get likely source files based on repo structure
function guessSourceFiles(fileTree: any[], owner: string, repo: string): string[] {
  const guessed: string[] = [];
  const priorities = [
    "README.md",
    "README",
    "package.json", // Node.js entry
    "setup.py", // Python entry
    "go.mod", // Go entry
    "Cargo.toml", // Rust entry
    "main.py",
    "src/main.rs",
    "src/lib.rs",
    "app.py",
    "index.js",
    "index.ts",
    "app.js",
    "server.js",
  ];

  // Add priority files
  guessed.push(...priorities.filter((p) => p));

  // Look for common src directories
  const srcDirs = ["src/", "lib/", "app/", "components/", "source/"];

  function findInTree(tree: any[], pathPrefix = ""): void {
    for (const item of tree) {
      const fullPath = pathPrefix ? `${pathPrefix}/${item.name}` : item.name;

      if (item.type === "file") {
        // Check if it's a main source file
        if (
          item.name.match(/\.(js|ts|py|go|rs|java|cpp|c|rb|php)$/) &&
          !item.name.match(/test|spec|\.min\./)
        ) {
          guessed.push(fullPath);
        }
      } else if (item.children) {
        findInTree(item.children, fullPath);
      }
    }
  }

  findInTree(fileTree);

  // Return top 10 files
  return guessed.slice(0, 10);
}

export { fetchFileContent, fetchCodeContext, guessSourceFiles };
export type { CodeContext };
