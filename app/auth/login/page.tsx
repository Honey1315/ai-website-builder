'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign-in');
      console.error('Google sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05080c] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Technical Grid & Glow Elements */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-primary-400) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary-400) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary-900/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full bg-secondary-900 border border-secondary-800 p-8 md:p-12 relative z-10 shadow-2xl">
        {/* Technical Corner Accents */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-500 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-500 opacity-50"></div>

        <div className="mb-10 text-center">
          <div className="text-[10px] font-mono text-primary-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary-400 block"></span>
            SYS_AUTH
          </div>
          <h2 className="text-3xl font-display text-white uppercase tracking-wide mb-3">Sign In</h2>
          <p className="text-secondary-400 text-sm font-light">
            Initialize session via Google credentials
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-danger-500/30 bg-danger-500/10 text-danger-500 text-[10px] font-mono uppercase tracking-widest flex items-start gap-3">
            <span className="mt-0.5 font-bold">ERR:</span>
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-4 px-8 py-4 bg-primary-500 text-secondary-900 font-bold uppercase tracking-widest text-sm transition-all hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-secondary-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* <div className="mt-8 pt-6 border-t border-secondary-800 text-center text-[10px] font-mono text-secondary-500 uppercase tracking-widest">
          No account? <a href="/auth/signup" className="text-primary-400 hover:text-primary-300 transition-colors">Initialize one</a>
        </div> */}
      </div>
    </div>
  );
}