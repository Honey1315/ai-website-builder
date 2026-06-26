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
    <div className="w-full h-full flex flex-col border rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 font-semibold text-sm shrink-0 flex items-center justify-between text-black">
        <div className=" bg-gray-50 font-semibold w-full">
          <div>Code Editor</div>
        </div>

        {/* <div className="flex items-center gap-2">
          {fileOptions.length > 1 && (
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
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
              className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm font-medium transition-colors"
            >
              Save
            </button>
          )}
        </div> */}
      </div>

      <div className="flex-1 overflow-hidden">
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