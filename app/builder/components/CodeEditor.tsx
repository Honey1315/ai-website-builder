"use client";

import { useState, useCallback, useEffect } from "react";
import { SandpackCodeEditor, useSandpack } from "@codesandbox/sandpack-react";

interface CodeEditorProps {
  onSave?: (code: string) => void;
  onSaveFile?: (filePath: string, code: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export default function CodeEditor({
  onSave,
  onSaveFile,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: CodeEditorProps) {
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

    runSandpack();
    onSaveFile?.(normalizedPath, currentCode);
    onSave?.(currentCode);

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

          {(onUndo || onRedo) && (
            <div className="h-7 flex items-center border border-secondary-700 bg-[#0a0f16] shrink-0 box-border">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo last file change (Ctrl+Z)"
                className="h-full w-7 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:text-primary-400 text-secondary-400 hover:bg-secondary-800 flex items-center justify-center"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" />
                  <path d="M3 13C5.5 7 10.5 5 16 6c2.5.5 4.5 2 6 4" />
                </svg>
              </button>
              <div className="w-px h-3.5 bg-secondary-700" />
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
                className="h-full w-7 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:text-primary-400 text-secondary-400 hover:bg-secondary-800 flex items-center justify-center"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 7v6h-6" />
                  <path d="M21 13C18.5 7 13.5 5 8 6 5.5 6.5 3.5 8 2 10" />
                </svg>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            title="Save file and update preview (Ctrl+S / Cmd+S)"
            className="h-7 px-2.5 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer border border-secondary-700 hover:border-primary-400 text-secondary-300 hover:text-white hover:bg-secondary-800 flex items-center gap-1.5 shrink-0 box-border"
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

      <div className="flex-1 overflow-hidden relative editor-wrapper flex flex-col min-h-0">
        <style dangerouslySetInnerHTML={{
          __html: `

          .editor-wrapper .sp-wrapper { height: 100% !important; max-height: 100% !important; flex: 1 1 0% !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
          .editor-wrapper .sp-layout { background: #05080c; border: none; border-radius: 0; height: 100% !important; max-height: 100% !important; flex: 1 1 0% !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
          .editor-wrapper .sp-stack { height: 100% !important; max-height: 100% !important; flex: 1 1 0% !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
          .editor-wrapper .sp-code-editor { flex: 1 1 0% !important; height: 100% !important; max-height: 100% !important; min-height: 0 !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; }
          .editor-wrapper .sp-cm,
          .editor-wrapper .cm-editor { height: 100% !important; max-height: 100% !important; flex: 1 1 0% !important; min-height: 0 !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; }
          .editor-wrapper .cm-scroller { overflow: auto !important; height: 100% !important; max-height: 100% !important; flex: 1 1 0% !important; min-height: 0 !important; }
          .editor-wrapper .sp-tabs { background: #0a0f16; border-bottom: 1px solid var(--color-secondary-800); shrink-0; }
          .editor-wrapper .sp-tab-button { color: var(--color-secondary-500); font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; border-radius: 0; }
          .editor-wrapper .sp-tab-button[data-active="true"] { color: var(--color-primary-400); box-shadow: inset 0 -2px 0 0 var(--color-primary-400); background: var(--color-primary-900)/10; }
        `}} />
        <SandpackCodeEditor
          showTabs
          showLineNumbers
          closableTabs
          style={{
            height: "100%",
            flex: 1,
            minHeight: 0,
          }}
        />
      </div>
    </div>
  );
}