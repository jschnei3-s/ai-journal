# Fix "Invalid JWT" Error

The "Invalid JWT" error means your auth token is being sent but Supabase can't validate it. Here's how to fix it:

## Quick Fix: Refresh Your Session

1. **Sign out** of the app
2. **Sign back in** with Google
3. **Try the journal editor again**

This will give you a fresh, valid token.

## If That Doesn't Work

### Step 1: Verify Edge Function Was Redeployed

Make sure you've redeployed the Edge Function with the updated code:
- Go to Supabase Dashboard → Edge Functions → `generate-prompts`
- Check that the code includes the `apikey` header handling
- If not, copy the code from `supabase/functions/generate-prompts/index.ts` and redeploy

### Step 2: Check Edge Function Logs

1. Go to Edge Functions → `generate-prompts → Logs`
2. Try typing in the journal editor
3. Look for logs showing:
   - `Using key type: apikey header` (should show this)
   - `❌ Auth error!` (if there's still an issue)

### Step 3: Verify Your Session

The code now:
- Checks if your token is expired
- Automatically refreshes it if needed
- Shows better error messages

If you see "Session expired" in the error, sign out and back in.

### Step 4: Check Browser Console

Open DevTools (F12) → Console and look for:
- "Using token, expires at: ..." - This shows your token expiration
- Any session errors

## Most Likely Solution

**Sign out and sign back in** - This will give you a fresh token and should fix the "Invalid JWT" error.

After signing back in, try the journal editor again. The AI prompts should work!



