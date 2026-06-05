"use client";

import { useState } from "react";

export default function PromptInput({ onSubmit }: any) {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="w-full flex gap-2">
      <input
        className="w-full p-3 border rounded-lg"
        placeholder="Describe your website..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        className="bg-black text-white px-4 rounded-lg"
        onClick={() => onSubmit(prompt)}
      >
        Generate
      </button>
    </div>
  );
}