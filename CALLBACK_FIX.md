# Callback Route 404 Fix

## The Issue
Getting a 404 when trying to access `/callback` after Google OAuth.

## Solution

1. **Clear Next.js cache** (already done):
   ```bash
   rm -rf .next
   ```

2. **Restart your dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

3. **Verify the route exists**:
   - The route should be at: `app/(auth)/callback/route.ts`
   - This creates the URL: `/callback`
   - Route groups (folders in parentheses) don't affect the URL

4. **Check the URL**:
   - Make sure Google OAuth is redirecting to: `http://localhost:3000/callback`
   - Not: `http://localhost:3000/auth/callback` or any other path

5. **Verify in Supabase**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Make sure `http://localhost:3000/callback` is in the Redirect URLs list

## If Still Getting 404

1. Check your terminal where `npm run dev` is running
2. Look for any build errors
3. Try accessing `/callback` directly in your browser (should redirect to login)
4. Check browser console (F12) for any errors

The route is correctly set up at `app/(auth)/callback/route.ts` which should be accessible at `/callback`.

