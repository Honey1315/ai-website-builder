"use client";

import { useState, useEffect } from "react";
import { signInWithGoogle } from "@/lib/auth-client";

const EXAMPLE_PROMPTS = [
  "A sleek SaaS landing page with a hero section, feature grid, pricing table, and a call-to-action footer. Dark mode with teal accents.",
  "A personal portfolio for a fullstack developer — animated hero, project cards with GitHub/live links, skills section, and contact form.",
  "A minimal productivity dashboard with sidebar navigation, task list with checkboxes, a calendar widget, and a progress tracker.",
  "An e-commerce product page with image gallery, size selector, add-to-cart button, reviews section, and a sticky purchase bar.",
];

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isPartial?: boolean;
  remainingCount?: number;
  onResume?: () => void;
  onReset?: () => void;
  disabled?: boolean;
  initialPrompt?: string;
  isAuthenticated?: boolean;
}

export default function PromptInput({
  onSubmit,
  isPartial = false,
  remainingCount = 0,
  onResume,
  onReset,
  disabled = false,
  initialPrompt = "",
  isAuthenticated = false,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    setPrompt(initialPrompt || "");
  }, [initialPrompt]);

  if (!isAuthenticated) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-4 border border-secondary-800 bg-[#0a0f16] p-6 text-center shrink-0">
        <div className="text-[10px] font-mono text-secondary-600 uppercase tracking-widest">
          Generate_Module
        </div>
        <p className="text-secondary-400 text-xs font-light leading-relaxed max-w-[220px]">
          Sign in to generate full-stack web applications
        </p>
        <button
          disabled={isSigningIn}
          onClick={async () => {
            try {
              setIsSigningIn(true);
              await signInWithGoogle("/builder");
            } catch {
              setIsSigningIn(false);
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] uppercase tracking-widest font-bold bg-primary-500 text-secondary-900 hover:bg-primary-400 transition-colors rounded-none disabled:opacity-50 border border-primary-500 cursor-pointer"
        >
          {isSigningIn ? "Connecting..." : "Sign In to Generate _"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary-500 z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary-500 z-10 pointer-events-none"></div>
        <textarea
          className="w-full h-32 p-4 bg-[#0a0f16] border border-secondary-800 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none placeholder:text-secondary-600 resize-none transition-colors disabled:opacity-50"
          placeholder="> initialize generation parameters (e.g. create a modern saas landing page)..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled}
        />
      </div>

      {!isPartial && !disabled && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-mono text-secondary-600 uppercase tracking-widest">
            — or pick an example —
          </span>
          <div className="flex flex-col gap-1.5">
            {EXAMPLE_PROMPTS.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(example)}
                className="w-full flex items-center text-left text-[10px] font-mono text-secondary-400 hover:text-primary-400 border border-secondary-800 hover:border-primary-500/50 bg-[#0a0f16] hover:bg-primary-500/5 px-3 py-2 transition-all duration-150 cursor-pointer rounded-none group min-w-0 overflow-hidden"
                title={example}
              >
                <span className="text-primary-500/60 group-hover:text-primary-400 mr-2 shrink-0 font-medium">#{i + 1}</span>
                <span className="truncate min-w-0 flex-1">{example}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isPartial && onResume ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 font-mono text-[10px] uppercase tracking-widest font-bold bg-amber-500 text-secondary-950 hover:bg-amber-400 transition-colors rounded-none border border-amber-500 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            onClick={onResume}
            disabled={disabled}
          >
            <span className="w-1.5 h-1.5 bg-secondary-950 block animate-pulse"></span>
            <span>Resume Generation ({remainingCount > 0 ? `${remainingCount} remaining` : "Continue"}) ↗</span>
          </button>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-secondary-400 hover:text-white border border-secondary-800 bg-secondary-900/60 hover:bg-secondary-800 transition-colors cursor-pointer"
            onClick={onReset}
            disabled={disabled}
          >
            <span>Start Fresh / New Project ↻</span>
          </button>
        </div>
      ) : (
        <button
          suppressHydrationWarning
          className="w-full flex items-center justify-center gap-3 px-6 py-4 font-mono text-[10px] uppercase tracking-widest font-bold bg-primary-500 text-secondary-900 hover:bg-primary-400 transition-colors rounded-none border border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          onClick={() => {
            if (prompt.trim()) onSubmit(prompt);
          }}
          disabled={!prompt.trim() || disabled}
        >
          <span className="w-1.5 h-1.5 bg-secondary-900 block"></span>
          Execute Generation _
        </button>
      )}
    </div>
  );
}