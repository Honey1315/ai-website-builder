import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function getUser() {
  try {
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

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return data?.user ?? null;
  } catch (err: any) {
    console.warn("[auth] Warning: Failed to connect to Supabase Auth (network/timeout):", err?.message || err);
    return null;
  }
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function getProjectIdFromRequest(request: Request): Promise<string | null> {
  const url = new URL(request.url);
  return url.searchParams.get('id') ?? null;
}

export async function getAuthUserId(request: Request): Promise<string | null> {
  const user = await getUser();
  return user?.id ?? null;
}

export async function verifyProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.projects.findUnique({
    where: { id: projectId },
    select: { user_id: true, name: true },
  });

  if (!project) {
    return null;
  }

  if (project.user_id !== userId) {
    throw new Error('Forbidden: You do not own this project');
  }

  return project;
}