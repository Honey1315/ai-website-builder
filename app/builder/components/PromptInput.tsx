"use client";

import { useState } from "react";

export default function PromptInput({ onSubmit }: any) {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="flex gap-3">
      <textarea
        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Describe your website..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        className="builder-btn rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-3 max-h-14"
        onClick={() => onSubmit(prompt)}
      >
        Generate
      </button>
    </div>
  );
}