"use client";

import { useState } from "react";

export default function ChatPanel({ onSend }: any) {
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        placeholder="Refine your app (e.g., make navbar sticky)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="builder-btn px-4 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        onClick={() => {
          onSend(message);
          setMessage("");
        }}
      >
        Send
      </button>
    </div>
  );
}