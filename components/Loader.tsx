"use client";

export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-12">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 border border-secondary-800 rounded-none"></div>
        <div className="absolute inset-0 border border-primary-400 animate-[spin_2s_linear_infinite] [clip-path:polygon(50%_0%,100%_0%,100%_50%,50%_50%)]"></div>
        <div className="w-2 h-2 bg-primary-400 animate-pulse"></div>
      </div>
      <p className="text-[10px] font-mono text-secondary-500 uppercase tracking-[0.2em]">
        System_Loading...
      </p>
    </div>
  );
}