"use client";

import { useState } from "react";
import PromptInput from "./components/PromptInput";
import PreviewPanel from "./components/PreviewPanel";
import CodeEditor from "./components/CodeEditor";
import ChatPanel from "./components/ChatPanel";

export default function BuilderPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const generateCode = async (prompt: string) => {
    setLoading(true);

    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    setCode(data.code);

    setLoading(false);
  };

  const refineCode = async (message: string) => {
    const res = await fetch("/api/refine", {
      method: "POST",
      body: JSON.stringify({ message, code }),
    });

    const data = await res.json();
    setCode(data.code);
  };

  return (
    <div className="p-6 grid grid-cols-2 gap-4">
      {/* LEFT SIDE */}
      <div className="flex flex-col gap-4">
        <PromptInput onSubmit={generateCode} />

        <ChatPanel onSend={refineCode} />

        <CodeEditor code={code} setCode={setCode} />
      </div>

      {/* RIGHT SIDE */}
      <div>
        <PreviewPanel code={code} />
      </div>
    </div>
  );
}