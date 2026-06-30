import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          }
        }
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

  // Redirect to home page or a specific page after sign in
  const url = requestUrl.origin;
  return NextResponse.redirect(url);
}