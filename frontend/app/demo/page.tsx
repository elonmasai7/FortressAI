export default function DemoPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-fortress-green/40 bg-slate-950 p-8">
        <h1 className="text-3xl font-bold text-fortress-green">FortressAI Demo Endpoint</h1>
        <p className="mt-3 text-slate-300">This is a mock destination for pitch QR scans. The full interactive deck runs at `localhost:3000`.</p>
        <div className="mt-6 rounded-lg border border-slate-700 p-4">
          <p>Status: SAFE</p>
          <p>Realtime-like updates active in the main dashboard.</p>
        </div>
      </div>
    </main>
  );
}
