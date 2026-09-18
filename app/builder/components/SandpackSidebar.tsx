"use client";

import { useState, useMemo } from "react";
import { useSandpack, SandpackFileExplorer } from "@codesandbox/sandpack-react";

export default function SandpackSidebar() {
  const { sandpack } = useSandpack();
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isDepsOpen, setIsDepsOpen] = useState(true);
  const [newPkg, setNewPkg] = useState("");

  // Safely parse dependencies directly from the Sandpack virtual package.json
  const dependencies = useMemo(() => {
    try {
      const pkgFile = sandpack.files["/package.json"];
      if (pkgFile && typeof pkgFile.code === "string") {
        const parsed = JSON.parse(pkgFile.code);
        return parsed.dependencies || {};
      }
    } catch (e) {
      console.error("Error parsing package.json:", e);
    }
    return {};
  }, [sandpack.files]);

  // Add dependency and update Sandpack state
  const handleAddDependency = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newPkg.trim()) {
      try {
        const pkgFile = sandpack.files["/package.json"];
        const parsed = pkgFile && typeof pkgFile.code === "string" 
          ? JSON.parse(pkgFile.code) 
          : { dependencies: {} };

        if (!parsed.dependencies) parsed.dependencies = {};
        
        // Handle optional version syntax (e.g., "framer-motion@10.0.0")
        const [name, version] = newPkg.trim().split("@");
        parsed.dependencies[name] = version || "latest";

        // Update the virtual file system - Sandpack will automatically fetch and bundle it
        sandpack.updateFile("/package.json", JSON.stringify(parsed, null, 2));
        setNewPkg("");
      } catch (e) {
        console.error("Failed to add dependency to package.json");
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0f111a] border-r border-secondary-800 text-secondary-300 font-sans select-none overflow-hidden explorer-wrapper">
      
      {/* --- EXPLORER SECTION --- */}
      <div className="flex flex-col flex-1 min-h-0">
        <button 
          onClick={() => setIsExplorerOpen(!isExplorerOpen)}
          className="flex items-center gap-1 px-2 py-2 hover:bg-secondary-800/50 transition-colors text-[11px] font-bold tracking-wide"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={2} 
            className={`w-3.5 h-3.5 transition-transform ${isExplorerOpen ? 'rotate-90' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          EXPLORER
        </button>
        
        {isExplorerOpen && (
          <div className="flex-1 overflow-auto relative">
            <style dangerouslySetInnerHTML={{__html: `
              .explorer-wrapper .sp-file-explorer { background: transparent; padding: 0 0.5rem; }
              .explorer-wrapper .sp-file-explorer .sp-button { color: #a0aec0; font-family: inherit; font-size: 13px; border-radius: 4px; padding: 4px 8px; margin-bottom: 2px; }
              .explorer-wrapper .sp-file-explorer .sp-button:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; }
              .explorer-wrapper .sp-file-explorer .sp-button[data-active="true"] { background: rgba(79, 209, 197, 0.15); color: #4fd1c5; }
            `}} />
            <SandpackFileExplorer />
          </div>
        )}
      </div>

      {/* --- DEPENDENCIES SECTION --- */}
      <div className="flex flex-col border-t border-secondary-800 min-h-[200px] shrink-0">
        <button 
          onClick={() => setIsDepsOpen(!isDepsOpen)}
          className="flex items-center gap-1 px-2 py-2 hover:bg-secondary-800/50 transition-colors text-[11px] font-bold tracking-wide"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={2} 
            className={`w-3.5 h-3.5 transition-transform ${isDepsOpen ? 'rotate-90' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          DEPENDENCIES
        </button>

        {isDepsOpen && (
          <div className="flex flex-col gap-2 p-3">
            {/* Search / Add Input */}
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-2 top-1.5 w-4 h-4 text-secondary-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input 
                type="text" 
                value={newPkg}
                onChange={(e) => setNewPkg(e.target.value)}
                onKeyDown={handleAddDependency}
                placeholder="Search..."
                className="w-full bg-[#05080c] border border-secondary-800 text-white text-sm pl-8 pr-2 py-1.5 focus:outline-none focus:border-primary-500 transition-colors rounded-sm"
              />
            </div>

            {/* Dependency List */}
            <div className="flex flex-col mt-2 gap-1 overflow-y-auto max-h-[200px] font-mono text-xs">
              {Object.entries(dependencies).map(([name, version]) => (
                <div key={name} className="flex items-center gap-3 px-1 py-1 hover:bg-secondary-800/30 rounded-sm group">
                  <span className="text-secondary-300 truncate flex-1">{name}</span>
                  <span className="text-secondary-600 shrink-0 group-hover:text-secondary-500">{version as string}</span>
                </div>
              ))}
              {Object.keys(dependencies).length === 0 && (
                <div className="text-secondary-600 text-center py-4 italic text-xs">No dependencies found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}