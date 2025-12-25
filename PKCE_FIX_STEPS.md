# PKCE Code Verifier Fix - Step by Step

## The Issue
The PKCE code verifier must be stored in cookies (not localStorage) so both the client (where OAuth starts) and server (where callback processes it) can access it.

## Important: Having Supabase open on another computer is NOT the issue
This is a browser storage issue on YOUR computer, not related to other devices.

## Fix Steps

### 1. Clear ALL Browser Storage
**This is the most important step:**

1. Open your browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. In the left sidebar, find **Cookies** → `http://localhost:3000`
4. **Delete ALL cookies** for localhost
5. Also clear **Local Storage** → `http://localhost:3000` (if any exists)
6. Close DevTools

### 2. Restart Your Dev Server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 3. Try in Incognito/Private Mode
Sometimes browser extensions interfere. Try:
- Chrome: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
- Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
- Safari: Cmd+Shift+N

### 4. Verify Your Setup

**Check `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key-here
```

**Check Supabase Dashboard:**
- Authentication → URL Configuration
- Make sure `http://localhost:3000/callback` is in Redirect URLs

### 5. Test the Flow

1. Go to `http://localhost:3000/login`
2. Click "Sign in with Google"
3. Complete the Google sign-in
4. You should be redirected back to your app

## Why This Happens

The PKCE code verifier is stored when you click "Sign in with Google". If:
- Cookies are blocked
- Storage is cleared between clicking and the callback
- Browser extensions interfere
- You're in a different browser/device

Then the code verifier won't be found.

## Still Not Working?

1. **Check browser console** (F12 → Console) for any errors
2. **Check Network tab** - look at the `/callback` request
3. **Try a different browser** (Chrome, Firefox, Safari)
4. **Disable browser extensions** temporarily
5. **Check if cookies are enabled** in your browser settings

The code has been updated to properly handle PKCE. The issue is almost always browser storage/cookies.

