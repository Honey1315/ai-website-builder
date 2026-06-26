"use client";

import { SandpackPreview } from "@codesandbox/sandpack-react";

export default function PreviewPanel() {
  return (
    <div className="w-full h-full flex flex-col border rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b bg-gray-50 font-semibold text-sm shrink-0">
        Live Preview
      </div>

      <div className="flex-1 overflow-hidden">
        <SandpackPreview
          style={{
            height: "100%",
          }}
          showNavigator
          showRefreshButton
        />
      </div>
    </div>
  );
}