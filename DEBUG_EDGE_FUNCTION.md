# Debug Edge Function 401 Error

You're getting a 401 error, which means the Edge Function isn't receiving a valid auth token. Here's how to debug:

## Step 1: Check Edge Function Logs (CRITICAL)

1. Go to **Supabase Dashboard** → **Edge Functions** → **`generate-prompts`**
2. Click **Logs** tab
3. Look for the most recent error
4. **Copy the exact error message** - this will tell us what's wrong

## Step 2: Common Issues

### Issue 1: Missing Authorization Header

**Error in logs**: "Missing Authorization header"

**Fix**: 
- Make sure you're signed in to the app
- Try signing out and signing back in
- Check browser console for auth errors

### Issue 2: Invalid Token

**Error in logs**: "Not authenticated" or "User not found"

**Fix**:
- Your session might have expired
- Sign out and sign back in
- Clear browser cookies and try again

### Issue 3: Edge Function Not Deployed

**Error**: Function not found or 404

**Fix**:
- Make sure the function is deployed
- Check Edge Functions page - should show "Active" or "Deployed"
- Redeploy if needed

## Step 3: Test the Function Directly

1. Go to **Edge Functions** → **`generate-prompts`**
2. Click **Invoke** or **Test**
3. You'll need to provide an auth token:
   - Go to your app
   - Open browser DevTools (F12) → Console
   - Run: `(await (await fetch('/api/auth/session')).json()).accessToken`
   - Or check Application → Cookies → find your auth token
4. Use this in the test:
   ```json
   {
     "content": "This is a test journal entry with enough content to generate a thoughtful prompt."
   }
   ```
5. Add header: `Authorization: Bearer YOUR_TOKEN_HERE`

## Step 4: Verify Your Session

In browser console, run:
```javascript
const { createClient } = await import('/lib/supabase/client.ts');
const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
console.log("Session:", session ? "Valid" : "Invalid");
console.log("Token:", session?.access_token?.substring(0, 20) + "...");
```

If session is invalid, sign in again.

## Step 5: Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for detailed error messages
4. The updated code should now show more specific errors

## What to Share

If it's still not working, share:
1. **The exact error from Edge Function logs** (Step 1)
2. **Browser console errors** (Step 5)
3. **Whether your session is valid** (Step 4)

This will help identify the exact issue!



