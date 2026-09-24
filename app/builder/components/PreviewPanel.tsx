"use client";

import { useState, useEffect } from "react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) setViewport("mobile");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isFullscreen]);


  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[100] w-full h-[100dvh] bg-[#05080c] flex flex-col overflow-hidden"
          : "w-full h-full flex flex-col bg-[#05080c] overflow-hidden relative group"
      }
    >
      {!isFullscreen && (
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary-700 opacity-50 z-10 pointer-events-none"></div>
      )}

      <div className="px-4 py-2 border-b border-secondary-800 bg-secondary-900 shrink-0 flex items-center justify-between z-10 gap-3">
        <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary-400 block animate-pulse"></span>
          <span>{isFullscreen ? "SYS_FULLSCREEN_PREVIEW" : "SYS_LIVE_PREVIEW"}</span>
          <span className="hidden sm:inline text-secondary-500 text-[9px]">
            [{VIEWPORT_CONFIG[viewport].dimension}]
          </span>
          {isFullscreen && (
            <span className="hidden md:inline text-[9px] px-1.5 py-0.5 border border-primary-500/30 text-primary-300 bg-primary-500/10">
              PRESS ESC TO EXIT
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0a0f16] border border-secondary-800 p-0.5 shrink-0">
            {(["desktop", "tablet"] as ViewportMode[]).map((mode) => {
              const isActive = viewport === mode;
              const config = VIEWPORT_CONFIG[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewport(mode)}
                  title={`${config.label} (${config.dimension}) - Switch to ${config.dimension} preview`}
                  aria-pressed={isActive}
                  className={`hidden md:flex px-2 sm:px-2.5 py-1 items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer border border-transparent ${isActive
                    ? "bg-primary-500 text-secondary-950 font-bold shadow-sm"
                    : "bg-transparent text-secondary-400 hover:text-white hover:bg-secondary-800"
                    }`}
                >
                  {config.icon}
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="hidden lg:inline opacity-75 font-normal">({config.dimension})</span>
                </button>
              );
            })}
            {(() => {
              const mode: ViewportMode = "mobile";
              const isActive = viewport === mode;
              const config = VIEWPORT_CONFIG[mode];
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewport(mode)}
                  title={`${config.label} (${config.dimension}) - Switch to ${config.dimension} preview`}
                  aria-pressed={isActive}
                  className={`px-2 sm:px-2.5 py-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer border border-transparent ${isActive
                    ? "bg-primary-500 text-secondary-950 font-bold shadow-sm"
                    : "bg-transparent text-secondary-400 hover:text-white hover:bg-secondary-800"
                    }`}
                >
                  {config.icon}
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="hidden lg:inline opacity-75 font-normal">({config.dimension})</span>
                </button>
              );
            })()}
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand Fullscreen Modal"}
            className={`p-1.5 border transition-colors cursor-pointer flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider ${isFullscreen
              ? "bg-danger-500/20 text-danger-300 border-danger-500/50 hover:bg-danger-500/30"
              : "bg-[#0a0f16] border-secondary-800 text-secondary-400 hover:text-primary-400 hover:border-primary-500/60"
              }`}
          >
            {isFullscreen ? (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                <span className="hidden lg:inline">Fullscreen</span>
              </>
            )}
          </button>
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

      <div
        className={`w-full h-full flex-1 preview-wrapper relative bg-[#06090e] flex flex-col transition-all duration-300 min-h-0 ${viewport === "desktop"
          ? "items-stretch p-0 overflow-hidden"
          : "items-center justify-start p-2 sm:p-4 md:p-6 overflow-auto"
          }`}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          .preview-wrapper .sp-wrapper, 
          .preview-wrapper .sp-layout { height: 100%; width: 100%; background: transparent; border: none; border-radius: 0; display: flex !important; flex-direction: column !important; flex: 1 1 0% !important; }
          .preview-wrapper .sp-stack,
          .preview-wrapper .sp-preview { height: 100% !important; width: 100% !important; flex: 1 1 0% !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; }
          .preview-wrapper .sp-preview-container { height: 100% !important; width: 100% !important; background: #ffffff !important; display: flex !important; flex-direction: column !important; flex: 1 1 0% !important; min-height: 0 !important; }
          .preview-wrapper .sp-preview-iframe,
          .preview-wrapper iframe { border: none !important; height: 100% !important; width: 100% !important; flex: 1 1 0% !important; min-height: max(400px, 50dvh) !important; display: block !important; }
          .preview-wrapper .sp-preview-actions { background: #0a0f16; border-bottom: 1px solid var(--color-secondary-800); shrink-0; }
          .preview-wrapper .sp-button { color: var(--color-secondary-400); }
          .preview-wrapper .sp-button:hover { color: var(--color-primary-400); }
          .preview-wrapper .sp-input { background: #05080c; border: 1px solid var(--color-secondary-800); color: var(--color-secondary-400); font-family: monospace; font-size: 10px; border-radius: 0; }
                    .preview-wrapper .sp-overlay.sp-error { display: none !important; }
        `}} />
        <div
          className={`transition-all duration-300 ease-out flex flex-col min-h-0 ${viewport === "desktop"
            ? "w-full h-full flex-1"
            : viewport === "tablet"
              ? "w-[768px] max-w-full h-full min-h-[500px] border border-secondary-800 shadow-2xl bg-[#0a0f16] my-auto"
              : "w-[375px] max-w-full h-full min-h-[550px] border border-secondary-800 rounded-2xl shadow-2xl overflow-hidden bg-[#0a0f16] my-auto"
            }`}
        >
          {viewport === "mobile" && (
            <div className="h-5 bg-secondary-900 border-b border-secondary-800 flex items-center justify-center shrink-0">
              <div className="w-12 h-1 bg-secondary-700 rounded-full" />
            </div>
          )}
          <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
            <SandpackPreview
              style={{
                height: "100%",
                flex: 1,
                minHeight: 0,
              }}
              showNavigator
              showRefreshButton
              showSandpackErrorOverlay={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}