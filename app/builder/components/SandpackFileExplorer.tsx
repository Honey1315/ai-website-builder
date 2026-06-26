"use client";

import { SandpackFileExplorer as OriginalFileExplorer } from "@codesandbox/sandpack-react";

export default function SandpackFileExplorer() {
  return (
    <div className="w-full h-full min-h-0 flex flex-col border rounded-lg bg-white overflow-hidden">
      <div className="p-4 bg-gray-50 font-semibold text-sm shrink-0 text-black">
        Files
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <OriginalFileExplorer
          style={{
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
