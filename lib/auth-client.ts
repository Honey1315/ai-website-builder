import { createBrowserClient } from '@supabase/ssr';

/**
 * Initiates Google OAuth authentication directly in-place from any component.
 * @param next Optional relative path to return to after successful authentication (defaults to current pathname).
 */
export async function signInWithGoogle(next?: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const targetPath = next || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');
  const redirectUrl = new URL('/auth/callback', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  if (targetPath && targetPath !== '/') {
    redirectUrl.searchParams.set('next', targetPath);
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl.toString(),
    },
  });

  if (error) {
    console.error('Google OAuth sign-in error:', error);
    throw error;
  }
}
