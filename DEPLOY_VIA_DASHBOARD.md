# Deploy Edge Function via Supabase Dashboard

Yes! You can deploy the Edge Function directly from the Supabase website. Here's how:

## Step 1: Go to Edge Functions in Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Edge Functions** in the left sidebar

## Step 2: Create New Function

1. Click **Create a new function**
2. Name it: `generate-prompts` (must match exactly)
3. Click **Create function**

## Step 3: Copy the Code

1. Open the file `supabase/functions/generate-prompts/index.ts` in your project
2. Copy **ALL** the code
3. Paste it into the code editor in the Supabase Dashboard
4. Click **Deploy** (or **Save**)

## Step 4: Set Environment Variables (Secrets)

1. In the Edge Functions page, click on **Settings** or **Secrets**
2. Add a new secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (get it from https://platform.openai.com/api-keys)
3. Click **Save**

**Note**: The Edge Function also needs these environment variables (they're usually auto-set):
- `PROJECT_URL` - Your Supabase project URL
- `SERVICE_ROLE_KEY` - Your service role key

These should already be available, but if you get errors, you can find them in:
- Dashboard → Settings → API → Project URL
- Dashboard → Settings → API → service_role key (keep this secret!)

## Step 5: Test It

1. Go back to your app
2. Start typing in the journal editor
3. After 2 seconds of inactivity (with at least 50 characters), you should see an AI prompt appear!

## Alternative: Upload via Dashboard

Some Supabase dashboards also allow you to:
1. Click **Upload** or **Import**
2. Upload the entire `supabase/functions/generate-prompts` folder
3. The dashboard will deploy it automatically

## Troubleshooting

### Function not found
- Make sure the function name is exactly `generate-prompts` (with the dash)
- Check that it's deployed (should show as "Active" or "Deployed")

### Missing environment variables
- Go to Edge Functions → Settings → Secrets
- Make sure `OPENAI_API_KEY` is set
- The other variables (`PROJECT_URL`, `SERVICE_ROLE_KEY`) should be auto-set by Supabase

### Check Logs
- In the Edge Functions page, click on your function
- Go to **Logs** tab
- This will show any errors when the function is called

### Test the Function
You can test it directly in the dashboard:
1. Click on the `generate-prompts` function
2. Look for a **Test** or **Invoke** button
3. Use this test payload:
   ```json
   {
     "content": "This is a test journal entry with enough content to generate a thoughtful prompt. I'm writing about my day and reflecting on what happened."
   }
   ```

## Quick Checklist

- [ ] Function created in dashboard named `generate-prompts`
- [ ] Code copied from `supabase/functions/generate-prompts/index.ts`
- [ ] Function deployed
- [ ] `OPENAI_API_KEY` secret set
- [ ] Tested in the app (type 50+ characters, wait 2 seconds)

That's it! No CLI needed if you use the dashboard.

