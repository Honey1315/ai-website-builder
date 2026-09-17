"use client";

import { useState } from "react";

export default function ChatPanel({ onSend }: any) {
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col gap-3 h-full">
      <textarea
        className="flex-1 w-full p-4 bg-[#0a0f16] border border-secondary-800 text-secondary-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none placeholder:text-secondary-700 resize-none transition-colors"
        placeholder="> input refinement parameters (e.g., make navbar sticky)..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="w-full flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] uppercase tracking-widest font-bold bg-primary-500 text-secondary-900 hover:bg-primary-400 transition-colors rounded-none disabled:opacity-50 border border-primary-500"
        onClick={() => {
          if (!message.trim()) return;
          onSend(message);
          setMessage("");
        }}
        disabled={!message.trim()}
      >
        <span>Transmit</span>
        <span className="font-sans">↗</span>
      </button>
    </div>
  );
}