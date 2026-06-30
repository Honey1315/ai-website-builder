import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function ProfilePage() {
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to login if not authenticated
    // In a real app, you might use redirect() from 'next/navigation'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
        <p className="text-red-600">You must be logged in to view this page. Redirecting...</p>
        <a href="/auth/login" className="text-blue-600 underline">
          Click here if not redirected automatically
        </a>
      </div>
    );
  }

  // Fetch user data from your database if needed
  // For now, we'll use the session data directly
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome, {session.user.user_metadata.full_name || session.user.email}!
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Profile Information
          </h2>

          <div className="space-y-4">
            <p><span className="font-medium">Name:</span> {session.user.user_metadata.full_name || 'N/A'}</p>
            <p><span className="font-medium">Email:</span> {session.user.email}</p>
            <p><span className="font-medium">User ID:</span> {session.user.id}</p>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              This is a protected route that requires authentication.
              Try accessing this page without logging in to see the redirect behavior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}