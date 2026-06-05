"use client";

import { useState } from "react";

export default function ChatPanel({ onSend }: any) {
  const [message, setMessage] = useState("");

  return (
    <div className="border rounded-lg p-3 flex flex-col gap-2">
      <textarea
        className="border p-2 rounded"
        placeholder="Refine your app (e.g., make navbar sticky)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="bg-green-600 text-white px-3 py-2 rounded"
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