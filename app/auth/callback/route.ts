import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  const errorParam = requestUrl.searchParams.get('error');
  const errorDesc = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error_code');

  if (errorParam) {
    console.error('Supabase OAuth callback returned error:', errorParam, errorDesc);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(errorDesc || errorParam)}`, requestUrl.origin)
    );
  }

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
            } catch {}
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Supabase exchangeCodeForSession failed:', exchangeError.message, exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    if (!exchangeError) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
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

  let safeRedirectUrl: URL;
  try {
    const decoded = decodeURIComponent(next);
    if (!decoded.startsWith('/') || decoded.startsWith('//')) throw new Error('invalid');
    const candidate = new URL(decoded, requestUrl.origin);
    if (candidate.origin !== requestUrl.origin) throw new Error('origin mismatch');
    candidate.searchParams.delete('error');
    candidate.searchParams.delete('error_code');
    candidate.searchParams.delete('error_description');
    safeRedirectUrl = candidate;
  } catch {
    safeRedirectUrl = new URL('/', requestUrl.origin);
  }
  return NextResponse.redirect(safeRedirectUrl);
}