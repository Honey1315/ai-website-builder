"use client";

export default function GenerateButton({ onClick, loading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full bg-primary-500 hover:bg-primary-400 text-secondary-900 font-bold font-mono text-[10px] uppercase tracking-widest px-6 py-4 rounded-none transition-colors border border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
    >
      {loading ? (
        <>
          <div className="w-3 h-3 border border-secondary-900 border-t-transparent animate-spin rounded-none"></div>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <span>Execute Generation _</span>
        </>
      )}
    </button>
  );
}