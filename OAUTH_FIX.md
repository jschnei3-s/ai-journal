# OAuth PKCE Fix

## The Problem
The error "PKCE code verifier not found in storage" occurs because the code verifier needs to be stored in cookies that are accessible to both the client (where OAuth starts) and the server (where the callback processes it).

## Solution

The issue is likely one of these:

1. **Browser storage was cleared** - Try clearing cookies and localStorage, then try again
2. **Cookie domain/path mismatch** - Make sure cookies are set for the correct domain
3. **Version mismatch** - Ensure you're using the latest `@supabase/ssr` package

## Quick Fix Steps

1. **Clear browser storage:**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear all cookies for localhost
   - Clear localStorage
   - Try signing in again

2. **Check package version:**
   ```bash
   npm list @supabase/ssr
   ```
   Should be version 0.1.0 or higher

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Try in incognito/private mode:**
   - Sometimes browser extensions interfere
   - Try in a fresh incognito window

## If Still Not Working

The code has been updated to properly handle the OAuth flow. If you're still seeing the error:

1. Make sure your Supabase redirect URL is exactly: `http://localhost:3000/callback`
2. Check that Google OAuth is properly configured in Supabase
3. Verify your `.env.local` has the correct Supabase URL and keys
4. Check the browser console for any additional errors

