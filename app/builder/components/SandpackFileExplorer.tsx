"use client";

import { SandpackFileExplorer as OriginalFileExplorer } from "@codesandbox/sandpack-react";

export default function SandpackFileExplorer() {
  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-[#05080c] overflow-hidden relative explorer-wrapper">
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-secondary-700 opacity-50 z-10 pointer-events-none"></div>

      <div className="p-3 bg-secondary-900 border-b border-secondary-800 shrink-0 flex items-center justify-between">
        <div className="text-[10px] font-mono text-secondary-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-secondary-600 block"></span>
          REPOSITORY_FILES
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto relative bg-[#05080c]">
        <style dangerouslySetInnerHTML={{
          __html: `
          .explorer-wrapper .sp-file-explorer { background: transparent; padding: 0.5rem; }
          .explorer-wrapper .sp-file-explorer .sp-button { color: var(--color-secondary-400); font-family: monospace; font-size: 11px; border-radius: 0; padding: 8px 12px; margin-bottom: 2px; letter-spacing: 0.05em; transition: all 0.2s; }
          .explorer-wrapper .sp-file-explorer .sp-button:hover { background: var(--color-secondary-900); color: white; }
          .explorer-wrapper .sp-file-explorer .sp-button[data-active="true"] { background: rgba(79, 209, 197, 0.1); color: var(--color-primary-400); border-left: 2px solid var(--color-primary-500); padding-left: 10px; }
        `}} />
        <OriginalFileExplorer
          style={{
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}