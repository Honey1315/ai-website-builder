"use client";

import { useState } from "react";
import { SandpackPreview } from "@codesandbox/sandpack-react";

interface PreviewPanelProps {
  error?: string | null;
  onAutoFix?: (message: string) => void;
}

type ViewportMode = "desktop" | "tablet" | "mobile";

interface ViewportConfig {
  label: string;
  dimension: string;
  icon: React.ReactNode;
}

const VIEWPORT_CONFIG: Record<ViewportMode, ViewportConfig> = {
  desktop: {
    label: "Desktop",
    dimension: "100%",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    ),
  },
  tablet: {
    label: "Tablet",
    dimension: "768px",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="16" height="20" x="4" y="2" rx="2" />
        <line x1="12" x2="12.01" y1="18" y2="18" />
      </svg>
    ),
  },
  mobile: {
    label: "Mobile",
    dimension: "375px",
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="20" x="5" y="2" rx="2" />
        <line x1="12" x2="12.01" y1="18" y2="18" />
      </svg>
    ),
  },
};

export default function PreviewPanel({ error, onAutoFix }: PreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportMode>("desktop");

  return (
    <div className="w-full h-full flex flex-col bg-[#05080c] overflow-hidden relative group">
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary-700 opacity-50 z-10 pointer-events-none"></div>

      <div className="px-4 py-2 border-b border-secondary-800 bg-secondary-900 shrink-0 flex items-center justify-between z-10">
        <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary-400 block animate-pulse"></span>
          SYS_LIVE_PREVIEW
          <span className="hidden sm:inline text-secondary-500 text-[9px]">
            [{VIEWPORT_CONFIG[viewport].dimension}]
          </span>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center bg-[#0a0f16] border border-secondary-800 p-0.5 shrink-0">
          {(Object.keys(VIEWPORT_CONFIG) as ViewportMode[]).map((mode) => {
            const isActive = viewport === mode;
            const config = VIEWPORT_CONFIG[mode];
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setViewport(mode)}
                title={`${config.label} (${config.dimension})`}
                className={`px-2 py-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer border border-transparent ${
                  isActive
                    ? "bg-primary-500 text-secondary-950 font-bold"
                    : "bg-transparent text-secondary-400 hover:text-white hover:bg-secondary-800"
                }`}
              >
                {config.icon}
                <span className="hidden md:inline">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-3 z-10 font-mono text-xs shrink-0">
          <div className="flex items-center gap-2 text-amber-400 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="truncate font-semibold text-[11px]">[BUILD_ERROR]: {error.split("\n")[0]}</span>
          </div>
          <button
            onClick={() => onAutoFix?.(`Fix this build error in the code: ${error}. Also inspect the file for any other invalid icon names, broken imports, or syntax errors and fix them all in one go.`)}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-secondary-950 px-3 py-1 font-bold text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-sm rounded-none border border-amber-400 cursor-pointer"
          >
            ⚡ Auto-Fix with AI
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-auto preview-wrapper relative bg-[#06090e] flex items-center justify-center transition-all duration-300 ${
        viewport === "desktop" ? "p-0" : "p-1 sm:p-3 md:p-5"
      }`}>
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
        <div
          className={`h-full transition-all duration-300 ease-out flex flex-col ${
            viewport === "desktop"
              ? "w-full"
              : viewport === "tablet"
              ? "w-[768px] max-w-full border border-secondary-800 shadow-2xl bg-[#0a0f16]"
              : "w-[375px] max-w-full border border-secondary-800 rounded-2xl shadow-2xl overflow-hidden bg-[#0a0f16]"
          }`}
        >
          {viewport === "mobile" && (
            <div className="h-5 bg-secondary-900 border-b border-secondary-800 flex items-center justify-center shrink-0">
              <div className="w-12 h-1 bg-secondary-700 rounded-full" />
            </div>
          )}
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
      </div>
    </div>
  );
}