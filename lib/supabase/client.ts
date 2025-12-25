import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

  // Explicitly configure cookies for PKCE code verifier storage
  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        // Get all cookies from document.cookie
        return document.cookie.split(';').map(cookie => {
          const [name, ...rest] = cookie.trim().split('=');
          return { 
            name: name.trim(), 
            value: decodeURIComponent(rest.join('=')) 
          };
        }).filter(c => c.name);
      },
      setAll(cookiesToSet) {
        // Set all cookies with proper options
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = [
            `path=${options?.path || '/'}`,
            options?.maxAge ? `max-age=${options.maxAge}` : '',
            options?.domain ? `domain=${options.domain}` : '',
            options?.secure ? 'secure' : '',
            options?.sameSite ? `samesite=${options.sameSite}` : 'samesite=lax',
            options?.httpOnly ? 'httponly' : '',
          ].filter(Boolean).join('; ');
          
          document.cookie = `${name}=${encodeURIComponent(value)}; ${cookieOptions}`;
        });
      },
    },
  });
}

