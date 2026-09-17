"use client";

import { useState } from "react";

export default function PromptInput({ onSubmit }: any) {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary-500 z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary-500 z-10 pointer-events-none"></div>
        <textarea
          className="w-full h-32 p-4 bg-[#0a0f16] border border-secondary-800 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none placeholder:text-secondary-600 resize-none transition-colors"
          placeholder="> initialize generation parameters (e.g. create a modern saas landing page)..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <button
        className="w-full flex items-center justify-center gap-3 px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold bg-primary-500 text-secondary-900 hover:bg-primary-400 transition-colors rounded-none border border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => {
          if (prompt.trim()) onSubmit(prompt);
        }}
        disabled={!prompt.trim()}
      >
        <span className="w-1.5 h-1.5 bg-secondary-900 block"></span>
        Execute Generation _
      </button>
    </div>
  );
}