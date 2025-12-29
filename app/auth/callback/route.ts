import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");
    const origin = requestUrl.origin;

    console.log("Callback received at /auth/callback:", { code: !!code, error, hasError: !!error });

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      const redirectUrl = new URL(`${origin}/login`);
      redirectUrl.searchParams.set("error", error);
      if (errorDescription) {
        redirectUrl.searchParams.set("error_description", errorDescription);
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange code for session
    if (code) {
      // IMPORTANT: Force Next.js to read all cookies before code exchange
      // Next.js 14+ lazily evaluates cookies, so we need to read them first
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      console.log("Cookies available:", allCookies.length, "cookies found");
      console.log("Cookie names:", allCookies.map(c => c.name).join(", "));
      
      const supabase = await createClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("Error exchanging code for session:", exchangeError);
        const redirectUrl = new URL(`${origin}/login`);
        redirectUrl.searchParams.set("error", "auth_failed");
        redirectUrl.searchParams.set("error_description", exchangeError.message);
        return NextResponse.redirect(redirectUrl);
      }

      if (!data?.session) {
        console.error("No session returned after code exchange");
        const redirectUrl = new URL(`${origin}/login`);
        redirectUrl.searchParams.set("error", "no_session");
        redirectUrl.searchParams.set("error_description", "Failed to create session");
        return NextResponse.redirect(redirectUrl);
      }

      console.log("Session created successfully, redirecting to dashboard");
      // Successfully authenticated, redirect to dashboard
      return NextResponse.redirect(`${origin}/journal/new`);
    }

    // No code provided, redirect to login
    console.log("No code provided, redirecting to login");
    return NextResponse.redirect(`${origin}/login`);
  } catch (err) {
    console.error("Unexpected error in callback:", err);
    const origin = new URL(request.url).origin;
    const redirectUrl = new URL(`${origin}/login`);
    redirectUrl.searchParams.set("error", "unexpected_error");
    redirectUrl.searchParams.set("error_description", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.redirect(redirectUrl);
  }
}

