'use client';

import Link from "next/link";
import { Button } from "./UI/Button";
import { useState, useEffect, useMemo, useRef } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { signInWithGoogle } from "@/lib/auth-client";

export function Navbar() {
  const [session, setSession] = useState<null | { user: { user_metadata: { full_name?: string; }, email?: string; } }>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (loading) {
    return (
      <nav className="bg-[#05080c] border-b border-secondary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="w-8 h-8 bg-primary-500/10 border border-primary-500/30 flex items-center justify-center group-hover:border-primary-400 transition-colors">
                <span className="text-primary-400 font-mono text-[10px]">AI</span>
              </div>
              <span className="text-sm font-display tracking-[0.2em] uppercase text-white">
                Website Builder
              </span>
            </Link>
            <div className="flex gap-4 items-center">
              <span className="text-[10px] font-mono text-secondary-600 uppercase tracking-widest animate-pulse">Initializing...</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-[#05080c] border-b border-secondary-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-4 group shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-500/10 border border-primary-500/30 flex items-center justify-center group-hover:border-primary-400 transition-colors">
              <span className="text-primary-400 font-mono text-[10px]">AI</span>
            </div>
            <span className="text-xs sm:text-sm font-display tracking-[0.15em] sm:tracking-[0.2em] uppercase text-white font-medium">
              <span className="hidden xs:inline sm:inline">AI </span>Website Builder
            </span>
          </Link>

          {/* Right Navigation */}
          <div className="flex gap-2 sm:gap-3 items-center shrink-0">
            {/* Authenticated user indicator */}
            {session && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-secondary-400 px-2 py-1 border border-secondary-800/80 bg-secondary-900/40">
                <span className="w-1.5 h-1.5 bg-primary-400"></span>
                <span className="max-w-[120px] truncate">
                  {session.user.user_metadata.full_name ||
                    session.user.email?.split("@")[0] ||
                    "SYS_USER"}
                </span>
              </span>
            )}

            {/* Guest sign in button */}
            {!session && (
              <Button
                variant="secondary"
                size="sm"
                disabled={isLoggingIn}
                onClick={async () => {
                  try {
                    setIsLoggingIn(true);
                    await signInWithGoogle();
                  } catch (e) {
                    console.error(e);
                    setIsLoggingIn(false);
                  }
                }}
                className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-xs cursor-pointer"
              >
                {isLoggingIn ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <span>Connecting...</span>
                  </span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Sign In with Google</span>
                    <span className="sm:hidden">Sign In</span>
                  </>
                )}
              </Button>
            )}

            {/* Three horizontal parallel lines menu button */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 border transition-all flex items-center justify-center cursor-pointer ${isOpen
                  ? "border-primary-500 bg-primary-500/10 text-primary-400 shadow-[0_0_12px_rgba(20,184,166,0.25)]"
                  : "border-secondary-800 bg-secondary-900/80 hover:border-primary-500/60 text-secondary-300 hover:text-primary-400"
                  }`}
                aria-label="Navigation Menu"
                aria-expanded={isOpen}
                title="Navigation Menu"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  {isOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="4" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="18" x2="20" y2="18" />
                    </>
                  )}
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-56 sm:w-64 bg-secondary-900 border border-secondary-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary-500"></div>

                  {/* Header if authenticated */}
                  {session && (
                    <div className="px-4 py-3 border-b border-secondary-800 bg-[#070b10]">
                      <div className="text-[9px] font-mono text-primary-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 bg-primary-400 block"></span>
                        SYS_USER
                      </div>
                      <div className="text-xs font-mono text-white truncate font-medium">
                        {session.user.user_metadata.full_name || session.user.email}
                      </div>
                    </div>
                  )}

                  {/* Navigation Links: Builder, Projects*/}
                  <div className="py-2">
                    <Link
                      href="/builder"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-secondary-300 hover:text-white hover:bg-secondary-800/60 transition-colors group"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 bg-secondary-600 group-hover:bg-primary-400 transition-colors"></span>
                        Builder
                      </span>
                      <span className="text-[10px] text-secondary-600 group-hover:text-primary-400 font-bold">_</span>
                    </Link>

                    <Link
                      href="/projects"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-secondary-300 hover:text-white hover:bg-secondary-800/60 transition-colors group"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 bg-secondary-600 group-hover:bg-primary-400 transition-colors"></span>
                        Projects
                      </span>
                      <span className="text-[10px] text-secondary-600 group-hover:text-primary-400">↗</span>
                    </Link>
                  </div>

                  {/* Authenticated Sign Out */}
                  {session && (
                    <div className="border-t border-secondary-800 p-2">
                      <button
                        onClick={async () => {
                          setIsOpen(false);
                          await supabase.auth.signOut();
                          window.location.href = "/";
                        }}
                        className="w-full text-left px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-secondary-500 hover:text-danger-500 hover:bg-danger-500/10 transition-colors cursor-pointer"
                      >
                        [ Terminate Session ]
                      </button>
                    </div>
                  )}

                  {/* Guest Sign In inside menu */}
                  {!session && (
                    <div className="border-t border-secondary-800 p-3">
                      <button
                        disabled={isLoggingIn}
                        onClick={async () => {
                          setIsOpen(false);
                          try {
                            setIsLoggingIn(true);
                            await signInWithGoogle();
                          } catch (e) {
                            console.error(e);
                            setIsLoggingIn(false);
                          }
                        }}
                        className="w-full py-2 px-3 text-xs font-mono uppercase tracking-wider bg-primary-500 text-secondary-900 font-bold hover:bg-primary-400 transition-colors text-center disabled:opacity-50 cursor-pointer"
                      >
                        {isLoggingIn ? "Connecting..." : "Sign In with Google"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}