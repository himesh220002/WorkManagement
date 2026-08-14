import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="main-dashboard p-6 flex-1 flex justify-center items-start">
      <div className="glass-card p-10 w-full max-w-4xl rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] mt-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="list-heading text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <i className="fa-solid fa-sparkles text-indigo-500"></i> About TaskFlow PM
          </h1>
          <Link href="/exec/dashboard" className="px-4 py-2 bg-[var(--glass-bg-hover)] text-[var(--text-primary)] rounded-lg hover:bg-white/10 transition-colors border border-[var(--glass-border)] flex items-center gap-2">
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </Link>
        </div>

        <p className="text-[var(--text-secondary)] mb-10 text-lg leading-relaxed">
          <strong>TaskFlow PM</strong> is a next-level full-stack Work Management application designed with modern dark glassmorphism, instant progress tracking, rich charts, enterprise pipeline integrations, and resilient database architecture built natively on Next.js 14 App Router.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-[var(--glass-border)] p-6 rounded-lg transition-transform hover:-translate-y-1">
            <i className="fa-solid fa-layer-group text-3xl text-purple-500 mb-4"></i>
            <h4 className="text-[var(--text-primary)] text-lg font-semibold mb-2">Multi-List Categories</h4>
            <p className="text-[var(--text-muted)] text-sm">Organize your work, personal tasks, and custom projects effortlessly.</p>
          </div>

          <div className="bg-white/5 border border-[var(--glass-border)] p-6 rounded-lg transition-transform hover:-translate-y-1">
            <i className="fa-solid fa-chart-pie text-3xl text-amber-500 mb-4"></i>
            <h4 className="text-[var(--text-primary)] text-lg font-semibold mb-2">Rich Analytics</h4>
            <p className="text-[var(--text-muted)] text-sm">Track team productivity, sprint velocity, and revenue pipelines natively.</p>
          </div>

          <div className="bg-white/5 border border-[var(--glass-border)] p-6 rounded-lg transition-transform hover:-translate-y-1">
            <i className="fa-solid fa-database text-3xl text-emerald-500 mb-4"></i>
            <h4 className="text-[var(--text-primary)] text-lg font-semibold mb-2">Hybrid Storage</h4>
            <p className="text-[var(--text-muted)] text-sm">Connects to MongoDB Cloud natively through robust Next.js Server Components.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
