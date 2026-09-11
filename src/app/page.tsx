export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full border border-neutral-800 bg-neutral-900/60 p-8 rounded-2xl shadow-2xl backdrop-blur">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Trackr</h1>
        <p className="text-neutral-400 mb-6 text-sm">Minimalist workout & activity logger</p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          System Online • sport.janrosell.com
        </div>
      </div>
    </main>
  );
}