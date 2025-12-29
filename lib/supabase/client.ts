import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

  // Use default cookie handling - Supabase SSR handles PKCE automatically
  // The default implementation properly stores the code verifier in cookies
  return createBrowserClient(supabaseUrl, supabaseKey);
}

