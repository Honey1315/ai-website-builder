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
    <div className="flex items-center gap-3 bg-[#0a0f16] border border-secondary-800 p-1">
      {/* Provider Tabs */}
      <div className="flex">
        {providers.map((key) => {
          const isActive = provider === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onProviderChange(key)}
              className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors rounded-none border border-transparent ${
                isActive
                  ? "bg-primary-500 text-secondary-900 font-bold"
                  : "bg-transparent text-secondary-500 hover:text-white hover:bg-secondary-800"
              }`}
            >
              {MODEL_CATALOG[key].label}
            </button>
          );
        })}
      </div>
      
      {/* Divider */}
      <div className="w-px h-6 bg-secondary-800"></div>

      {/* Model Dropdown */}
      <div className="relative flex items-center mr-1">
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="appearance-none bg-transparent text-primary-400 font-mono text-[10px] uppercase tracking-widest pl-3 pr-8 py-2 max-w-[200px] truncate focus:outline-none focus:ring-0 cursor-pointer hover:text-primary-300 transition-colors"
          aria-label="AI model"
        >
          {MODEL_CATALOG[provider].models.map((m) => (
            <option key={m} value={m} className="bg-secondary-900 text-secondary-300">
              {m}
            </option>
          ))}
        </select>
        {/* Custom Caret */}
        <div className="absolute right-3 pointer-events-none text-primary-400 flex flex-col gap-0.5">
           <svg width="8" height="4" viewBox="0 0 8 4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="rotate-180">
             <path d="M4 0L8 4H0L4 0Z" />
           </svg>
           <svg width="8" height="4" viewBox="0 0 8 4" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
             <path d="M4 0L8 4H0L4 0Z" />
           </svg>
        </div>
      </div>
    </div>
  );
}