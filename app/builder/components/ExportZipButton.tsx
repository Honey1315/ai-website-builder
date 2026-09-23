"use client";

import { useState } from "react";
import { FileData } from "@/types/ai";
import { downloadProjectZip } from "@/lib/zipExporter";

interface ExportZipButtonProps {
  files: FileData[];
  code: string;
  projectName?: string;
  disabled?: boolean;
}

export default function ExportZipButton({
  files,
  code,
  projectName = "ai-website",
  disabled,
}: ExportZipButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (disabled || isExporting) return;
    setIsExporting(true);

    try {
      const sanitizedName =
        projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "ai-website";

      await downloadProjectZip(sanitizedName, files, code);
    } catch (err) {
      console.error("Failed to export ZIP:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`px-2.5 sm:px-4 py-2 sm:py-2.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest flex items-center gap-1.5 sm:gap-2.5 border transition-colors rounded-none cursor-pointer shrink-0 ${
        disabled || isExporting
          ? "border-secondary-800 text-secondary-600 bg-secondary-900/50 cursor-not-allowed"
          : "border-secondary-700 text-white bg-transparent hover:border-primary-400 hover:text-primary-400"
      }`}
      title="Download complete Vite + React + Tailwind CSS project source code as a ZIP archive"
    >
      {isExporting ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent animate-spin shrink-0"></div>
          <span>[ Exporting... ]</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-3.5 h-3.5 text-primary-400 shrink-0"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          <span>ZIP<span className="hidden md:inline"> Export</span></span>
        </>
      )}
    </button>
  );
}
