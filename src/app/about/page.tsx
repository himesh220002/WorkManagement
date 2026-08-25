import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="flex flex-col min-w-0 p-6 flex-1 flex justify-center items-start">
      <div className="glass-panel p-10 w-full max-w-4xl mt-10 neon-border-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 mix-blend-screen"></div>
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold glow-text flex items-center gap-3">
            <i className="fa-solid fa-sparkles text-indigo-500"></i> About TaskFlow PM
          </h1>
          <Link href="/exec/dashboard" className="glass-card px-4 py-2 text-gray-900 dark:text-gray-100 flex items-center gap-2 hover:bg-white/20">
            <i className="fa-solid fa-arrow-left"></i> Back to Dashboard
          </Link>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-10 text-lg leading-relaxed relative z-10">
          <strong>TaskFlow PM</strong> is a next-level full-stack Work Management application designed with modern dark glassmorphism, instant progress tracking, rich charts, enterprise pipeline integrations, and resilient database architecture built natively on Next.js 14 App Router.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="glass-card p-6 rounded-lg group">
            <i className="fa-solid fa-layer-group text-3xl text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"></i>
            <h4 className="text-gray-900 dark:text-gray-100 text-lg font-semibold mb-2">Multi-List Categories</h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Organize your work, personal tasks, and custom projects effortlessly.</p>
          </div>

          <div className="glass-card p-6 rounded-lg group">
            <i className="fa-solid fa-chart-pie text-3xl text-amber-500 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"></i>
            <h4 className="text-gray-900 dark:text-gray-100 text-lg font-semibold mb-2">Rich Analytics</h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Track team productivity, sprint velocity, and revenue pipelines natively.</p>
          </div>

          <div className="glass-card p-6 rounded-lg group">
            <i className="fa-solid fa-database text-3xl text-emerald-500 mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"></i>
            <h4 className="text-gray-900 dark:text-gray-100 text-lg font-semibold mb-2">Hybrid Storage</h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Connects to MongoDB Cloud natively through robust Next.js Server Components.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
