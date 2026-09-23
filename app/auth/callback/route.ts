import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in read-only contexts
            }
          },
        },
      }
    );

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Get the user data from Supabase
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Create or update user in our database
        try {
          await prisma.user.upsert({
            where: { id: user.id },
            update: {
              email: user.email || '',
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || undefined,
              image: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
              updatedat: new Date(),
            },
            create: {
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || undefined,
              image: user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined,
              createdat: new Date(),
              updatedat: new Date(),
            },
          });
        } catch (error) {
          console.error('Error upserting user to database:', error);
        }
      }
    }
  }

  // Safe redirect: decode then re-validate to prevent encoded bypass attacks (e.g. /%2F/evil.com).
  // Build the target URL against our own origin — if `next` is absolute or escapes the origin
  // after normalisation, Next.js will throw and we fall back to '/'.
  let safeRedirectUrl: URL;
  try {
    const decoded = decodeURIComponent(next);
    // Must start with '/' and must not be a protocol-relative URL
    if (!decoded.startsWith('/') || decoded.startsWith('//')) throw new Error('invalid');
    // Construct against origin — this normalises traversal sequences
    const candidate = new URL(decoded, requestUrl.origin);
    // Final guard: the resolved origin must still match ours
    if (candidate.origin !== requestUrl.origin) throw new Error('origin mismatch');
    safeRedirectUrl = candidate;
  } catch {
    safeRedirectUrl = new URL('/', requestUrl.origin);
  }
  return NextResponse.redirect(safeRedirectUrl);
}