"use client";

import { SandpackPreview } from "@codesandbox/sandpack-react";

export default function PreviewPanel() {
  return (
    <div className="w-full h-full flex flex-col bg-[#05080c] overflow-hidden relative group">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary-700 opacity-50 z-10 pointer-events-none"></div>

      <div className="px-4 py-3 border-b border-secondary-800 bg-secondary-900 shrink-0 flex items-center justify-between z-10">
        <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary-400 block animate-pulse"></span>
          SYS_LIVE_PREVIEW
        </div>
      </div>

      <div className="flex-1 overflow-hidden preview-wrapper relative bg-[#0a0f16]">
        <style dangerouslySetInnerHTML={{__html: `
          .preview-wrapper .sp-wrapper, 
          .preview-wrapper .sp-layout { height: 100%; width: 100%; background: transparent; border: none; border-radius: 0; }
          .preview-wrapper .sp-preview-container { height: 100%; background: #ffffff; display: flex; flex-direction: column; }
          .preview-wrapper .sp-preview-iframe { border: none; flex-grow: 1; }
          .preview-wrapper .sp-preview-actions { background: #0a0f16; border-bottom: 1px solid var(--color-secondary-800); }
          .preview-wrapper .sp-button { color: var(--color-secondary-400); }
          .preview-wrapper .sp-button:hover { color: var(--color-primary-400); }
          .preview-wrapper .sp-input { background: #05080c; border: 1px solid var(--color-secondary-800); color: var(--color-secondary-400); font-family: monospace; font-size: 10px; border-radius: 0; }
        `}} />
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