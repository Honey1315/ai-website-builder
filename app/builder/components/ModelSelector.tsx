"use client";

import type { ModelProvider } from "@/types/ai";
import { MODEL_CATALOG } from "@/utils/constants";

interface ModelSelectorProps {
  provider: ModelProvider;
  model: string;
  onProviderChange: (provider: ModelProvider) => void;
  onModelChange: (model: string) => void;
}

export default function ModelSelector({
  provider,
  model,
  onProviderChange,
  onModelChange,
}: ModelSelectorProps) {
  const providers = Object.keys(MODEL_CATALOG) as ModelProvider[];

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 bg-[#0a0f16] border border-secondary-800 p-0.5 sm:p-1 shrink-0">
      <div className="flex">
        {providers.map((key) => {
          const isActive = provider === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onProviderChange(key)}
              className={`px-2 sm:px-3.5 py-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest transition-colors rounded-none border border-transparent cursor-pointer ${
                isActive
                  ? "bg-primary-500 text-secondary-950 font-bold"
                  : "bg-transparent text-secondary-500 hover:text-white hover:bg-secondary-800"
              }`}
            >
              <span className="sm:hidden">{key === "openrouter" ? "OR" : "GEM"}</span>
              <span className="hidden sm:inline">{MODEL_CATALOG[key].label}</span>
            </button>
          );
        })}
      </div>

      <div className="w-px h-5 sm:h-6 bg-secondary-800"></div>

      <div className="relative flex items-center mr-0.5 sm:mr-1">
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="appearance-none bg-transparent text-primary-400 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest pl-1.5 sm:pl-3 pr-6 sm:pr-8 py-1.5 max-w-[110px] xs:max-w-[140px] sm:max-w-[200px] md:max-w-[280px] truncate focus:outline-none focus:ring-0 cursor-pointer hover:text-primary-300 transition-colors"
          aria-label="AI model"
        >
          {MODEL_CATALOG[provider].models.map((m) => (
            <option key={m} value={m} className="bg-secondary-900 text-secondary-300">
              {m}
            </option>
          ))}
        </select>
        <div className="absolute right-1.5 sm:right-3 pointer-events-none text-primary-400 flex flex-col gap-0.5">
          <svg width="6" height="3" viewBox="0 0 8 4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="rotate-180 sm:w-2 sm:h-1">
            <path d="M4 0L8 4H0L4 0Z" />
          </svg>
          <svg width="6" height="3" viewBox="0 0 8 4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="sm:w-2 sm:h-1">
            <path d="M4 0L8 4H0L4 0Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}