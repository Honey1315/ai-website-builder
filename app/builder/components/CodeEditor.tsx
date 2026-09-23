"use client";

import { useState, useCallback, useEffect } from "react";
import { SandpackCodeEditor, useSandpack } from "@codesandbox/sandpack-react";

interface CodeEditorProps {
  onSave?: (code: string) => void;
  onSaveFile?: (filePath: string, code: string) => void;
}

export default function CodeEditor({ onSave, onSaveFile }: CodeEditorProps) {
  const { sandpack } = useSandpack();
  const { activeFile, files, runSandpack } = sandpack;
  const safeActiveFile = activeFile || "";

  const [justSaved, setJustSaved] = useState(false);

  const handleSave = useCallback(() => {
    if (!safeActiveFile) return;
    const file = files[safeActiveFile];
    const currentCode =
      file && typeof file === "object" && "code" in file ? file.code : "";
    const normalizedPath = safeActiveFile.replace(/^\//, "");

    // 1. Manually recompile and refresh the live preview
    runSandpack();

    // 2. Notify parent to sync the files state in React
    onSaveFile?.(normalizedPath, currentCode);
    onSave?.(currentCode);

    // 3. Visual feedback
    setJustSaved(true);
    const timer = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [safeActiveFile, files, runSandpack, onSaveFile, onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  return (
    <div className="w-full h-full flex flex-col border border-secondary-800 bg-[#05080c] overflow-hidden relative group">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary-700 opacity-50 z-10 pointer-events-none"></div>

      <div className="p-2.5 px-3 bg-secondary-900 border-b border-secondary-800 flex items-center justify-between shrink-0">
        <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary-400 block animate-pulse"></span>
          SYS_CODE_EDITOR
          {safeActiveFile && (
            <span className="hidden sm:inline text-secondary-500 text-[9px]">
              [{safeActiveFile.replace(/^\//, "")}]
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {justSaved && (
            <span className="text-emerald-400 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              [SAVED & RELOADED]
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            title="Save file and update preview (Ctrl+S / Cmd+S)"
            className="px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer border border-secondary-700 hover:border-primary-400 text-secondary-300 hover:text-white hover:bg-secondary-800 flex items-center gap-1.5"
          >
            <svg className="w-3 h-3 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save <span className="hidden xs:inline text-secondary-500">(Ctrl+S)</span>
          </button>
        </div>
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