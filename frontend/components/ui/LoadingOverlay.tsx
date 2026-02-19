export function LoadingOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-black/75">
      <div className="flex items-center gap-3 text-sm text-slate-100">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-fortress-gold" />
        <span>{label}</span>
      </div>
    </div>
  );
}
