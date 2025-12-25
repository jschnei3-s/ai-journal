import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  
  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If using placeholder values, skip auth check (frontend-only mode)
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/journal/new");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Journaling
          </h1>
          <p className="text-gray-600">
            Reflect, process, and grow with AI-guided prompts
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8">
          {params.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Sign in failed</p>
              <p className="text-xs text-red-600 mt-1">
                {params.error_description || params.error}
              </p>
            </div>
          )}
          <LoginForm />
          <p className="mt-6 text-xs text-center text-gray-500">
            By signing in, you agree to our privacy policy. Your journal entries
            are encrypted and never shared.
          </p>
        </div>
      </div>
    </div>
  );
}

