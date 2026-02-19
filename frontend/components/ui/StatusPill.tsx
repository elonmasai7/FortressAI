type StatusPillProps = {
  status: 'SAFE' | 'ALERT';
};

export function StatusPill({ status }: StatusPillProps) {
  const base =
    status === 'SAFE'
      ? 'border-fortress-green/70 bg-fortress-green/10 text-fortress-green'
      : 'border-fortress-red/70 bg-fortress-red/10 text-fortress-red';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-semibold ${base}`}>
      <span className="h-2.5 w-2.5 animate-ping rounded-full bg-current" aria-hidden="true" />
      <span>{status}</span>
    </div>
  );
}
