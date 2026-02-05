/**
 * GitHub File Structure API
 * Fetches the directory tree of a GitHub repository
 */

interface GitHubFile {
  name: string;
  type: "file" | "dir";
  path: string;
  size?: number;
}

interface FileTreeNode extends GitHubFile {
  children?: FileTreeNode[];
}

async function fetchGitHubTree(
  owner: string,
  repo: string,
  path: string = ""
): Promise<GitHubFile[]> {
  try {
    // GitHub API endpoint for getting contents
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        // Add token if available for higher rate limits
        ...(process.env.GITHUB_TOKEN && { Authorization: `token ${process.env.GITHUB_TOKEN}` }),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Repository not found");
      }
      if (response.status === 403) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // Single file case
    if (!Array.isArray(data)) {
      return [];
    }

    // Filter out common non-essential directories
    const filtered = data.filter((item: any) => {
      const name = item.name.toLowerCase();
      const excluded = [
        ".git",
        ".github",
        "node_modules",
        ".next",
        "dist",
        "build",
        ".venv",
        "__pycache__",
        ".pytest_cache",
      ];
      return !excluded.some((ex) => name.includes(ex));
    });

    return filtered.map((item: any) => ({
      name: item.name,
      type: item.type === "dir" ? "dir" : "file",
      path: item.path,
      size: item.size,
    }));
  } catch (error) {
    console.error("Error fetching GitHub tree:", error);
    throw error;
  }
}

// Build tree recursively
async function buildFileTree(
  owner: string,
  repo: string,
  path: string = "",
  depth: number = 0,
  maxDepth: number = 3
): Promise<FileTreeNode[]> {
  if (depth > maxDepth) return [];

  try {
    const files = await fetchGitHubTree(owner, repo, path);

    const tree: FileTreeNode[] = [];

    for (const file of files) {
      if (file.type === "dir" && depth < maxDepth) {
        const children = await buildFileTree(owner, repo, file.path, depth + 1, maxDepth);
        tree.push({
          ...file,
          children,
        });
      } else {
        tree.push(file);
      }
    }

    return tree;
  } catch (error) {
    console.error(`Error building tree for ${path}:`, error);
    return [];
  }
}

// Get key files (README, package.json, main source files)
async function getKeyFiles(owner: string, repo: string): Promise<string[]> {
  const keyFiles = [
    "README.md",
    "README",
    "package.json",
    "setup.py",
    "pyproject.toml",
    "requirements.txt",
    "Dockerfile",
    "docker-compose.yml",
    ".env.example",
    "tsconfig.json",
    "webpack.config.js",
    "next.config.js",
  ];

  try {
    const files = await fetchGitHubTree(owner, repo, "");
    const fileNames = files.map((f) => f.name.toLowerCase());

    return keyFiles.filter((kf) => fileNames.some((fn) => fn === kf.toLowerCase()));
  } catch {
    return [];
  }
}

export { fetchGitHubTree, buildFileTree, getKeyFiles };
export type { FileTreeNode, GitHubFile };
