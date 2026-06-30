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
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Website Builder
              </span>
            </Link>

            <div className="flex gap-4 items-center">
              <span className="animate-pulse">Loading...</span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Website Builder
            </span>
          </Link>

          <div className="flex gap-4 items-center">
            {/* Authenticated user navigation */}
            {session && (
              <>
                <Link href="/projects">
                  <Button variant="secondary">Projects</Button>
                </Link>
                <Link href="/builder">
                  <Button variant="primary">Build</Button>
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {session.user.user_metadata.full_name ||
                      session.user.email?.split("@")[0] ||
                      "User"}

                    <svg
                      className={`h-4 w-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-50">
                      <div className="px-4 py-2 text-sm text-gray-700">
                        {session.user.user_metadata.full_name || session.user.email}
                      </div>

                      <hr />

                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full justify-start rounded-none"
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.href = "/";
                        }}
                      >
                        Sign out
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
                  <Button variant="primary">Build</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="secondary">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}