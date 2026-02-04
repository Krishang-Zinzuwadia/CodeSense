export type DeepWikiAnalysis = {
  repoUrl: string;
  summary: string;
  findings: string[];
  /**
   * Indicates this response was produced by the local stub implementation.
   * The real DeepWiki MCP integration should remove or replace this field.
   */
  stub: true;
};

/**
 * Internal helper: pure stub implementation.
 *
 * This remains the default and fallback behavior even when HTTP mode is
 * configured, so the rest of the app always has a safe baseline.
 */
async function analyzeWithStub(repoUrl: string): Promise<DeepWikiAnalysis> {
  const trimmedUrl = repoUrl.trim();

  if (!trimmedUrl) {
    throw new Error("Repository URL is required for DeepWiki analysis.");
  }

  return {
    repoUrl: trimmedUrl,
    summary:
      "This is a DeepWiki MCP stub response. It does not perform real repository analysis yet.",
    findings: [
      "MCP wiring is in place and ready for real DeepWiki integration.",
      "Replace this stub with an actual DeepWiki MCP client to analyze the repository structure, docs, and code.",
      "Use this contract to drive higher-level agents (summaries, GSoC-style recommendations, and diagrams).",
    ],
    stub: true,
  };
}

/**
 * Live analysis using Gemini directly from the Next.js runtime.
 *
 * This is the primary "real" path when GEMINI_API_KEY is configured. If
 * anything fails (no key, network error, bad response), callers should fall
 * back to the stub implementation.
 */
async function analyzeWithGemini(
  repoUrl: string
): Promise<DeepWikiAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const prompt = [
    "You are helping a developer understand a GitHub repository and plan contributions.",
    `Repository URL: ${repoUrl}`,
    "",
    "Without cloning the repo, infer likely structure and contribution paths from the URL and common project patterns.",
    "Return a short summary (2–3 sentences) and 3–5 concise bullet points of concrete contribution ideas.",
  ].join("\n");

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey),
    {
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
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini HTTP error: ${response.status}`);
  }

  const json = (await response.json()) as any;
  const text: string =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Gemini did not return any content.";

  const lines = text.split("\n").map((line) => line.trim());
  const nonEmpty = lines.filter(Boolean);

  const summary = nonEmpty[0] ?? "No summary generated.";
  const findings: string[] =
    nonEmpty
      .slice(1)
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[\-*]\s*/, "")) || [];

  return {
    repoUrl,
    summary,
    findings,
    stub: true, // keep field for now to avoid breaking the contract
  };
}

/**
 * Core DeepWiki entrypoint used by the app.
 *
 * Modes:
 * 1. Gemini live mode (preferred): if GEMINI_API_KEY is set, we call the
 *    Gemini HTTP API directly for a live, model-powered analysis.
 * 2. Stub mode (fallback): if GEMINI_API_KEY is missing or any live call
 *    fails, we fall back to the local stub so the UI always has data.
 *
 * The function name, input type, and output fields are preserved so that
 * callers and UI components do not need to change as we upgrade the backend.
 */
export async function analyzeRepositoryWithDeepWiki(
  repoUrl: string
): Promise<DeepWikiAnalysis> {
  const trimmedUrl = repoUrl.trim();

  if (!trimmedUrl) {
    throw new Error("Repository URL is required for DeepWiki analysis.");
  }

  try {
    // Preferred path: live Gemini-backed analysis.
    return await analyzeWithGemini(trimmedUrl);
  } catch (error) {
    // Any configuration or network error should not break the app; we degrade
    // gracefully to the local stub.
    // eslint-disable-next-line no-console
    console.error("[DeepWiki] Live mode error, falling back to stub:", error);
    return analyzeWithStub(trimmedUrl);
  }
}

