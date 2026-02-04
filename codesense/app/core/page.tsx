import React from "react";
import { analyzeRepositoryWithDeepWiki } from "./mcp/deepwikiClient";

const DEFAULT_REPO_URL = "https://github.com/vercel/next.js";

type CorePageSearchParams = {
  repo?: string;
};

async function getDeepWikiData(repoUrl?: string | null) {
  const effectiveRepoUrl = (repoUrl ?? "").trim() || DEFAULT_REPO_URL;
  const data = await analyzeRepositoryWithDeepWiki(effectiveRepoUrl);
  return { data, effectiveRepoUrl };
}

export default async function CorePage({
  searchParams,
}: {
  // In Next.js 16, searchParams is provided as a Promise and must be awaited.
  searchParams: Promise<CorePageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const repoFromQuery = resolvedSearchParams?.repo ?? null;
  const { data: deepWikiData, effectiveRepoUrl } =
    await getDeepWikiData(repoFromQuery);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#040715] via-[#050014] to-[#1c0f37] text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.35),_transparent_60%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.45),_transparent_55%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-8 pt-6 pb-4">
          <div className="text-lg font-semibold tracking-[0.22em] uppercase text-slate-50 drop-shadow-md">
            CodeSense
          </div>
        </header>

        <div className="flex flex-1 flex-row gap-6 px-8 pb-10">
          {/* Left rail: repo input / drop zone */}
          <section className="flex w-[260px] flex-col rounded-3xl border border-white/10 bg-white/5/40 p-4 backdrop-blur-xl">
            <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_0_60px_rgba(15,23,42,0.9)]">
              <form
                method="get"
                action="/core"
                className="flex h-full flex-col gap-3 text-[11px] text-slate-100"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                    Repository URL
                  </p>
                  <p className="text-[11px] text-slate-300/90">
                    Paste any public GitHub repository URL. Submitting will
                    refresh the core panel with a DeepWiki-powered summary.
                  </p>
                </div>

                <div className="mt-1 space-y-2">
                  <input
                    type="url"
                    name="repo"
                    defaultValue={effectiveRepoUrl}
                    placeholder="https://github.com/owner/repo"
                    className="w-full rounded-xl border border-white/15 bg-black/40/80 px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 outline-none backdrop-blur focus:border-sky-400/80 focus:ring-1 focus:ring-sky-500/70"
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-[11px] font-medium tracking-wide text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.35)] backdrop-blur transition duration-300 hover:bg-sky-400/20 hover:shadow-[0_0_40px_rgba(56,189,248,0.8)] focus:outline-none focus:ring-2 focus:ring-sky-300/80 focus:ring-offset-2 focus:ring-offset-black/60"
                  >
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-slate-950/80" />
                    Analyze Repository
                  </button>
                </div>

                <p className="mt-auto text-[10px] leading-relaxed text-slate-400">
                  Paste any public GitHub repository URL to generate a concise
                  overview and contribution ideas for that project.
                </p>
              </form>
            </div>
          </section>

          {/* Main panel: chat / analysis surface */}
          <section className="flex-1 rounded-3xl border border-white/10 bg-black/20 p-6 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
            <div className="flex h-full flex-col gap-4">
              <header className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-300/80">
                  Core Intelligence Surface
                </p>
                <p className="text-sm text-slate-300/90">
                  This panel shows a structured summary of the repository you
                  entered, plus the raw JSON returned from the DeepWiki client.
                </p>
              </header>

              <div className="flex-1">
                {/* Human-readable summary only */}
                <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/50 p-4 text-[12px] shadow-[0_0_40px_rgba(15,23,42,0.9)]">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                        Active Repository
                      </p>
                      <p className="truncate text-[11px] text-slate-100">
                        {effectiveRepoUrl}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/40">
                      {process.env.GEMINI_API_KEY
                        ? "Gemini live mode"
                        : "Stub mode"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                      Summary
                    </p>
                    <p className="text-[12px] leading-relaxed text-slate-100/90">
                      {deepWikiData.summary}
                    </p>
                  </div>

                  {deepWikiData.findings?.length ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                        Key Findings
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-[12px] text-slate-200/90">
                        {deepWikiData.findings.map((rawFinding, idx) => {
                          // Strip simple markdown (**bold**) and backticks that may come from the model.
                          const cleaned = rawFinding
                            .replace(/^\*+/g, "")
                            .replace(/\*+$/g, "")
                            .replace(/`/g, "")
                            .trim();

                          const [maybeTitle, ...rest] = cleaned.split(":");
                          const hasTitle =
                            rest.length > 0 && maybeTitle.trim().length > 0;
                          const remainder = rest.join(":").trim();

                          return (
                            <li key={idx}>
                              {hasTitle ? (
                                <>
                                  <span className="font-semibold text-slate-50">
                                    {maybeTitle.trim()}:
                                  </span>{" "}
                                  <span className="text-slate-200/90">
                                    {remainder}
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-200/90">
                                  {cleaned}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>

              <footer className="mt-3 text-[11px] text-slate-400">
                Results are generated with Gemini and are meant to guide
                high-impact, contributor-friendly work in the selected repo.
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

