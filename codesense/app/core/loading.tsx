export default function CoreLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#040715] via-[#050014] to-[#1c0f37] text-slate-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.35),_transparent_60%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.45),_transparent_55%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-8 pt-6 pb-4">
          <div className="text-lg font-semibold tracking-[0.22em] uppercase text-slate-50/70">
            CodeSense
          </div>
        </header>

        <div className="flex flex-1 flex-row gap-6 px-8 pb-10">
          {/* Left rail skeleton */}
          <section className="flex w-[260px] flex-col rounded-3xl border border-white/10 bg-white/5/40 p-4 backdrop-blur-xl">
            <div className="flex-1 rounded-2xl border border-white/10 bg-black/20 p-3 shadow-[0_0_60px_rgba(15,23,42,0.9)]">
              <div className="h-3 w-24 animate-pulse rounded-full bg-slate-700/60" />
              <div className="mt-4 space-y-2">
                <div className="h-2.5 w-full animate-pulse rounded-full bg-slate-700/40" />
                <div className="h-2.5 w-5/6 animate-pulse rounded-full bg-slate-700/40" />
              </div>
              <div className="mt-5 h-8 w-full animate-pulse rounded-xl bg-sky-500/40" />
            </div>
          </section>

          {/* Main panel skeleton */}
          <section className="flex-1 rounded-3xl border border-white/10 bg-black/20 p-6 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-2xl">
            <div className="flex h-full flex-col gap-4">
              <div className="space-y-2">
                <div className="h-3 w-40 animate-pulse rounded-full bg-slate-700/60" />
                <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-slate-700/40" />
              </div>

              <div className="mt-2 flex-1 rounded-2xl border border-white/10 bg-black/50 p-4">
                <div className="space-y-3">
                  <div className="h-2.5 w-32 animate-pulse rounded-full bg-slate-700/50" />
                  <div className="space-y-2">
                    <div className="h-2.5 w-full animate-pulse rounded-full bg-slate-700/40" />
                    <div className="h-2.5 w-11/12 animate-pulse rounded-full bg-slate-700/40" />
                    <div className="h-2.5 w-5/6 animate-pulse rounded-full bg-slate-700/30" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-slate-700/40" />
                    <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-slate-700/30" />
                    <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-slate-700/30" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}


