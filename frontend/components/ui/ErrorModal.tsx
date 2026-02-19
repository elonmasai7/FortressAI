'use client';

type ErrorModalProps = {
  title: string;
  message: string;
  open: boolean;
  onClose: () => void;
};

export function ErrorModal({ title, message, open, onClose }: ErrorModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-md rounded-xl border border-fortress-red/60 bg-[#141416] p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-fortress-red">{title}</h3>
        <p className="mt-2 text-sm text-slate-200">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 rounded-lg border border-fortress-red bg-fortress-red/20 px-4 py-2 text-sm font-semibold text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
