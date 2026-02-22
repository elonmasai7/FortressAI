'use client';

import { useEffect } from 'react';

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-slate-300">{error.message || 'Unexpected application error'}</p>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
