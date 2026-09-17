"use client";

import { useMemo, useCallback } from "react";
import { SandpackCodeEditor, useSandpack } from "@codesandbox/sandpack-react";

interface CodeEditorProps {
  onSave?: (code: string) => void;
}

export default function CodeEditor({ onSave }: CodeEditorProps) {
  const { sandpack } = useSandpack();
  const { visibleFiles, activeFile, openFile, files } = sandpack;
  const safeActiveFile = activeFile || "";

  const fileOptions = useMemo(
    () => visibleFiles.map((file) => ({ label: file.replace(/^\//, ""), value: file })),
    [visibleFiles]
  );

  const handleSave = useCallback(() => {
    if (onSave && safeActiveFile) {
      const file = files[safeActiveFile];
      if (file && typeof file === "object" && "code" in file) {
        onSave(file.code);
      }
    }
  }, [onSave, safeActiveFile, files]);

  return (
    <div className="w-full h-full flex flex-col border border-secondary-800 bg-[#05080c] overflow-hidden relative group">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary-700 opacity-50 z-10 pointer-events-none"></div>

      <div className="p-3 bg-secondary-900 border-b border-secondary-800 flex items-center justify-between shrink-0">
        <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary-400 block animate-pulse"></span>
          SYS_CODE_EDITOR
        </div>

        {/* <div className="flex items-center gap-2">
          {fileOptions.length > 1 && (
            <select
              className="bg-[#0a0f16] border border-secondary-800 text-secondary-400 font-mono text-[10px] px-2 py-1 rounded-none focus:border-primary-500 focus:outline-none uppercase tracking-wider"
              value={safeActiveFile}
              onChange={(event) => openFile(event.target.value)}
            >
              {fileOptions.map((file) => (
                <option key={file.value} value={file.value}>
                  {file.label}
                </option>
              ))}
            </select>
          )}
          {onSave && (
            <button
              onClick={handleSave}
              className="bg-transparent border border-secondary-700 hover:border-primary-400 text-secondary-400 hover:text-primary-400 px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors rounded-none"
            >
              Save
            </button>
          )}
        </div> */}
      </div>

      <div className="flex-1 overflow-hidden relative editor-wrapper">
        <style dangerouslySetInnerHTML={{__html: `
          .editor-wrapper .sp-wrapper { height: 100%; }
          .editor-wrapper .sp-layout { background: #05080c; border: none; border-radius: 0; }
          .editor-wrapper .sp-tabs { background: #0a0f16; border-bottom: 1px solid var(--color-secondary-800); }
          .editor-wrapper .sp-tab-button { color: var(--color-secondary-500); font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 0; }
          .editor-wrapper .sp-tab-button[data-active="true"] { color: var(--color-primary-400); box-shadow: inset 0 -2px 0 0 var(--color-primary-400); background: var(--color-primary-900)/10; }
        `}} />
        <SandpackCodeEditor
          showTabs
          showLineNumbers
          closableTabs
          style={{
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}