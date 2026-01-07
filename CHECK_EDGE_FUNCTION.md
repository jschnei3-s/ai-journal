# Quick Check: Edge Function Setup

The error "Edge Function returned a non-2xx status code" means the function is being called but returning an error. Here's a quick checklist:

## ✅ Step 1: Check Edge Function Logs (MOST IMPORTANT)

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on **`generate-prompts`**
3. Click **Logs** tab
4. Look for the most recent error - this will tell you exactly what's wrong

**Common errors you might see:**
- "Missing required environment variables" → Need to set secrets
- "OpenAI error" → Invalid API key or no credits
- "Not authenticated" → Auth issue
- "Content too short" → Need 50+ characters (this is normal)

## ✅ Step 2: Verify Secrets Are Set

1. Go to **Edge Functions** → **Settings** → **Secrets**
2. Make sure you see:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `PROJECT_URL` - Should be auto-set (your Supabase URL)
   - `SERVICE_ROLE_KEY` - Should be auto-set (your service role key)

**If PROJECT_URL or SERVICE_ROLE_KEY are missing:**
- Go to **Settings** → **API**
- Copy your **Project URL** 
- Copy your **service_role** key (keep this secret!)
- Add them as secrets in Edge Functions → Settings → Secrets

## ✅ Step 3: Test the Function Directly

1. Go to **Edge Functions** → **`generate-prompts`**
2. Click **Invoke** or **Test** button
3. Use this test payload:
   ```json
   {
     "content": "This is a test journal entry with enough content to generate a thoughtful prompt. I'm writing about my day and reflecting on what happened."
   }
   ```
4. Check the response - if it works here, the issue is with how the app is calling it

## ✅ Step 4: Check OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Verify your API key is valid
3. Check that you have credits in your account
4. If needed, update the secret in Supabase

## ✅ Step 5: Verify Function Code

Make sure the function code in the dashboard matches `supabase/functions/generate-prompts/index.ts` in your project.

**Key things to check:**
- Function accepts `content` parameter
- Returns `prompt_text` in the response
- Has proper error handling

## 🔍 What to Share

If it's still not working, share:
1. **The exact error from Edge Function logs** (Step 1)
2. **Which secrets are set** (Step 2)
3. **Result of the test** (Step 3)

This will help identify the exact issue!



