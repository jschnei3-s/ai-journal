# Troubleshooting Edge Function Errors

## Error: "Edge Function returned a non-2xx status code"

This error means the Edge Function is being called but returning an error status (400, 401, 500, etc.). Here's how to debug:

## Step 1: Check Edge Function Logs

1. Go to Supabase Dashboard → **Edge Functions**
2. Click on `generate-prompts`
3. Go to **Logs** tab
4. Look for recent errors - this will show you the exact error message

## Step 2: Common Issues and Fixes

### Issue 1: Missing Environment Variables

**Error in logs**: "Missing required environment variables"

**Fix**:
1. Go to Edge Functions → **Settings** → **Secrets**
2. Make sure these are set:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `PROJECT_URL` - Your Supabase project URL (usually auto-set)
   - `SERVICE_ROLE_KEY` - Your service role key (usually auto-set)

**To find PROJECT_URL and SERVICE_ROLE_KEY**:
- Dashboard → Settings → API
- Copy "Project URL" for PROJECT_URL
- Copy "service_role" key for SERVICE_ROLE_KEY (keep this secret!)

### Issue 2: Invalid OpenAI API Key

**Error in logs**: "OpenAI error" or "Failed to generate prompts"

**Fix**:
1. Verify your OpenAI API key is correct
2. Make sure you have credits in your OpenAI account
3. Check the key at https://platform.openai.com/api-keys
4. Update the secret: Edge Functions → Settings → Secrets → Edit `OPENAI_API_KEY`

### Issue 3: Authentication Error

**Error in logs**: "Not authenticated" or "Missing Authorization header"

**Fix**:
- Make sure you're signed in to the app
- Try signing out and signing back in
- Check browser console for auth errors

### Issue 4: Content Too Short

**Error in logs**: "Content too short. Need at least 50 characters."

**Fix**:
- This is expected - the function requires at least 50 characters
- Just keep typing, the prompt will appear once you have enough content

### Issue 5: Function Not Found

**Error**: "Function not found" or 404 error

**Fix**:
- Make sure the function is named exactly `generate-prompts` (with dash, lowercase)
- Check that it's deployed: Edge Functions page should show it as "Active"
- Try redeploying the function

## Step 3: Test the Function Directly

You can test the function in the Supabase Dashboard:

1. Go to Edge Functions → `generate-prompts`
2. Click **Invoke** or **Test**
3. Use this test payload:
   ```json
   {
     "content": "This is a test journal entry with enough content to generate a thoughtful prompt. I'm writing about my day and reflecting on what happened."
   }
   ```
4. Check the response - if it works here but not in the app, it's likely an auth issue

## Step 4: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for errors when you type in the journal editor
4. The error message should give you more details

## Step 5: Verify Function Code

Make sure the function code in the dashboard matches `supabase/functions/generate-prompts/index.ts` in your project.

## Quick Checklist

- [ ] Function `generate-prompts` exists and is deployed
- [ ] `OPENAI_API_KEY` secret is set
- [ ] OpenAI API key is valid and has credits
- [ ] You're signed in to the app
- [ ] Content is at least 50 characters
- [ ] Checked Edge Function logs for specific error
- [ ] Tested function directly in dashboard

## Still Not Working?

1. **Check the exact error in logs** - this will tell you what's wrong
2. **Try redeploying the function** - copy the code again and redeploy
3. **Verify environment variables** - make sure all secrets are set correctly
4. **Test with a simple curl command** (if you have CLI access):
   ```bash
   curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/generate-prompts' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"content":"This is a test entry with enough content to generate a prompt."}'
   ```



