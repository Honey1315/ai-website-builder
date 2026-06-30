'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      // Note: The user will be redirected to the callback URL
      // We'll handle the session in the callback route
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign-up');
      console.error('Google sign-up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Create Account</h2>
          <p className="text-center text-gray-600 mb-6">
            Sign up with Google to start building your website
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  <span>Creating your account...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 0a10 10 0 100 20 10 10 0 000-20zM6.293 8.293a1 1 0 011.414 0L10 11.17l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"></path>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <a href="/auth/login" className="font-medium text-blue-600 hover:underline">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
}