import { createBrowserClient } from '@supabase/ssr';

export async function signInWithGoogle(next?: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let targetPath = next;
  if (!targetPath && typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.delete('error');
    url.searchParams.delete('error_code');
    url.searchParams.delete('error_description');
    url.searchParams.delete('code');
    const search = url.searchParams.toString();
    targetPath = url.pathname + (search ? `?${search}` : '');
  }
  if (!targetPath) targetPath = '/';

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
