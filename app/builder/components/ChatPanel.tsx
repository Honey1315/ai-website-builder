"use client";

import { useState, useRef, useEffect } from "react";
import { signInWithGoogle } from "@/lib/auth-client";
import type { ChatMessage } from "@/types/ai";

interface ChatPanelProps {
  onSend: (message: string) => void;
  error?: string | null;
  isAuthenticated?: boolean;
  messages?: ChatMessage[];
  isLoading?: boolean;
  statusMessage?: string;
}

export default function ChatPanel({
  onSend,
  error,
  isAuthenticated = false,
  messages = [],
  isLoading = false,
  statusMessage,
}: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when messages or loading state updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSend(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
                onClick={() =>
                  onSend(
                    `Fix this build error in the code: ${error}. Also inspect the file for any other invalid icon names, broken imports, or syntax errors and fix them all in one go.`
                  )
                }
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
          {/* Conversation History Stream */}
          {messages.length > 0 && (
            <div className="max-h-64 sm:max-h-72 overflow-y-auto p-3 bg-[#05080c] border border-secondary-800 flex flex-col gap-3 font-mono text-xs">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`p-2.5 rounded-none border text-[11px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-secondary-900/70 border-secondary-700/60 text-secondary-200 self-end w-[92%]"
                      : "bg-[#08111c] border-primary-500/30 text-primary-300 self-start w-[95%]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-secondary-800/60 text-[9px] uppercase tracking-wider">
                    <span
                      className={`font-bold flex items-center gap-1.5 ${
                        msg.role === "user" ? "text-secondary-400" : "text-primary-400"
                      }`}
                    >
                      <span
                        className={`w-1 h-1 block ${
                          msg.role === "user" ? "bg-secondary-400" : "bg-primary-400"
                        }`}
                      ></span>
                      {msg.role === "user" ? "USER_PROMPT" : "SYS_UPDATE"}
                    </span>
                    {msg.timestamp && (
                      <span className="text-secondary-600 text-[8px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              ))}

              {isLoading && (
                <div className="p-2.5 bg-[#08111c] border border-primary-500/30 text-primary-300 text-[11px] self-start w-[95%] flex items-center gap-2">
                  <div className="w-2.5 h-2.5 border border-primary-400 border-t-transparent animate-spin"></div>
                  <span className="text-[10px] uppercase tracking-wider text-primary-400">
                    {statusMessage || "Executing refinement sequence..."}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Prompt Input Box */}
          <div className="relative shrink-0">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary-500 z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary-500 z-10 pointer-events-none"></div>
            <textarea
              className="w-full h-24 p-3 bg-[#0a0f16] border border-secondary-800 text-secondary-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-none placeholder:text-secondary-600 resize-none transition-colors"
              placeholder="> input refinement parameters (e.g. 'make it darker', 'add reset next to pause')..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between gap-2 text-[9px] font-mono text-secondary-600 px-1 -mt-2">
            <span>ENTER to transmit · SHIFT+ENTER for newline</span>
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 px-6 py-3 font-mono text-[10px] uppercase tracking-widest font-bold bg-primary-500 text-secondary-900 hover:bg-primary-400 transition-colors rounded-none disabled:opacity-50 border border-primary-500 cursor-pointer shrink-0"
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
          >
            <span>{isLoading ? "Processing..." : "Transmit Refinement"}</span>
            <span className="font-sans">↗</span>
          </button>
        </>
      )}
    </div>
  );
}