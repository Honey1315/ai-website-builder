"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth-client";

interface ChatPanelProps {
  onSend: (message: string) => void;
  error?: string | null;
  isAuthenticated?: boolean;
}

export default function ChatPanel({ onSend, error, isAuthenticated = false }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-mono text-amber-400">
            <span className="flex items-center gap-1.5 font-bold">
              <span>⚡</span>
              <span>SANDPACK_ERROR</span>
            </span>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => onSend(`Fix this build error in the code: ${error}. Also inspect the file for any other invalid icon names, broken imports, or syntax errors and fix them all in one go.`)}
                className="text-[10px] uppercase font-bold tracking-widest text-amber-300 hover:text-amber-200 underline cursor-pointer"
              >
                Auto-Fix ↗
              </button>
            )}
          </div>
          <p className="text-[11px] font-mono text-amber-300/80 line-clamp-2 break-all">
            {error.split("\n")[0]}
          </p>
        </div>
      )}

      {!isAuthenticated ? (
        // ── Unauthenticated state ──────────────────────────────────────────────
        <div className="h-48 flex flex-col items-center justify-center gap-4 border border-secondary-800 bg-[#0a0f16] p-6 text-center shrink-0">
          <div className="text-[10px] font-mono text-secondary-600 uppercase tracking-widest">
            Refine_Module
          </div>
          <p className="text-secondary-400 text-xs font-light leading-relaxed max-w-[220px]">
            Sign in to iteratively refine your generated project
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
            {isSigningIn ? "Connecting..." : "Sign In to Refine _"}
          </button>
        </div>
      ) : (
        // ── Authenticated state ────────────────────────────────────────────────
        <>
          <div className="relative shrink-0">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary-500 z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary-500 z-10 pointer-events-none"></div>
            <textarea
              className="w-full h-32 p-4 bg-[#0a0f16] border border-secondary-800 text-secondary-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none placeholder:text-secondary-700 resize-none transition-colors"
              placeholder="> input refinement parameters (e.g., make navbar sticky)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] uppercase tracking-widest font-bold bg-primary-500 text-secondary-900 hover:bg-primary-400 transition-colors rounded-none disabled:opacity-50 border border-primary-500 cursor-pointer shrink-0"
            onClick={() => {
              if (!message.trim()) return;
              onSend(message);
              setMessage("");
            }}
            disabled={!message.trim()}
          >
            <span>Transmit</span>
            <span className="font-sans">↗</span>
          </button>
        </>
      )}
    </div>
  );
}