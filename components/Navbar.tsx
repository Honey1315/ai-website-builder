'use client';

import Link from "next/link";
import { Button } from "./UI/Button";
import { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from '@supabase/ssr';

export function Navbar() {
  const [session, setSession] = useState<null | { user: { user_metadata: { full_name?: string; }, email?: string; } }>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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
            {/* Authenticated user navigation */}
            {session && (
              <>
                <Link href="/projects">
                  <Button variant="secondary" size="sm">Projects</Button>
                </Link>
                <Link href="/builder">
                  <Button variant="primary" size="sm">Build _</Button>
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 px-3 py-2 border border-transparent hover:border-secondary-800 text-xs font-mono text-secondary-400 hover:text-primary-400 transition-colors"
                  >
                    <span>
                      {session.user.user_metadata.full_name ||
                        session.user.email?.split("@")[0] ||
                        "SYS_USER"}
                    </span>
                    <svg
                      className={`h-3 w-3 transition-transform ${
                        isOpen ? "rotate-180 text-primary-400" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="square" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-secondary-900 border border-secondary-800 shadow-2xl z-50">
                      <div className="px-4 py-3 text-[10px] font-mono text-secondary-500 border-b border-secondary-800 truncate">
                        ID: {session.user.user_metadata.full_name || session.user.email}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start rounded-none border-t border-transparent hover:border-secondary-800 text-left"
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.href = "/";
                        }}
                      >
                        [ Terminate Session ]
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Guest navigation */}
            {!session && (
              <>
                <Link href="/builder">
                  <Button variant="primary" size="sm">Build _</Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="secondary" size="sm">Authenticate</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}