# OAuth Troubleshooting Guide

## Common Issues and Solutions

### Issue: Redirects back to login page after Google OAuth

This usually happens due to one of these reasons:

#### 1. **Redirect URL Mismatch in Supabase**

**Check:**
- Go to Supabase Dashboard → Authentication → URL Configuration
- Make sure your redirect URL is set correctly:
  - For development: `http://localhost:3000/callback`
  - For production: `https://yourdomain.com/callback`

**Fix:**
1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Add `http://localhost:3000/callback` to "Redirect URLs"
4. Save

#### 2. **Google OAuth Not Properly Configured**

**Check:**
- Supabase Dashboard → Authentication → Providers → Google
- Make sure Google provider is enabled
- Verify Client ID and Client Secret are correct

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to APIs & Services → Credentials
4. Find your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", add:
   - `https://[your-project-ref].supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret
7. Paste them into Supabase Dashboard → Authentication → Providers → Google
8. Save

#### 3. **Session Not Being Set Properly**

The callback route should exchange the code for a session. Check:
- Browser console for errors
- Network tab to see if the callback is being called
- Check if cookies are being set

#### 4. **Middleware Blocking the Callback**

The middleware might be redirecting before the session is established.

**Solution:** The callback route should run before middleware checks. Make sure `/callback` is not being blocked.

## Debugging Steps

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for errors when clicking "Sign in with Google"

2. **Check Network Tab**
   - Click "Sign in with Google"
   - Watch for the redirect to Google
   - After authorizing, check if `/callback` is called
   - Look at the response from `/callback`

3. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for authentication errors

4. **Verify Environment Variables**
   - Make sure `.env.local` has correct values:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

5. **Test the Callback Directly**
   - After clicking "Sign in with Google", check the URL when it redirects back
   - It should be: `http://localhost:3000/callback?code=...`
   - If you see an error parameter, that's the issue

## Quick Fix Checklist

- [ ] Google OAuth is enabled in Supabase
- [ ] Client ID and Secret are correct in Supabase
- [ ] Redirect URL in Supabase matches: `http://localhost:3000/callback`
- [ ] Google Cloud Console has the correct redirect URI
- [ ] `.env.local` has correct Supabase credentials
- [ ] No browser extensions blocking cookies
- [ ] Try in incognito/private mode

## Still Not Working?

1. Clear browser cookies for localhost
2. Try a different browser
3. Check Supabase project status (make sure it's not paused)
4. Verify your Supabase project URL is correct
5. Make sure you're using the correct environment (dev vs production)



