# Deploy Edge Function for AI Prompts

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **OpenAI API Key**
   - Get one from https://platform.openai.com/api-keys
   - You'll need to add credits to your OpenAI account

## Step 1: Login to Supabase CLI

```bash
supabase login
```

This will open your browser to authenticate.

## Step 2: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
- Go to Supabase Dashboard → Settings → General
- Copy the "Reference ID"

Or if you're already in the project directory, it might auto-detect it.

## Step 3: Set OpenAI API Key Secret

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

Replace `your-openai-api-key-here` with your actual OpenAI API key.

## Step 4: Deploy the Edge Function

```bash
supabase functions deploy generate-prompts
```

This will deploy the function to your Supabase project.

## Step 5: Verify Deployment

1. Go to Supabase Dashboard → Edge Functions
2. You should see `generate-prompts` listed
3. Click on it to see logs and details

## Step 6: Test It

The function should now be called automatically when you type in the journal editor (after 2 seconds of inactivity with at least 50 characters).

## Troubleshooting

### Error: "Missing required environment variables"
- Make sure you set the `OPENAI_API_KEY` secret
- Run `supabase secrets list` to verify

### Error: "Not authenticated"
- Make sure you're signed in to the app
- Check that the auth token is being passed correctly

### Error: "Failed to generate prompt"
- Check your OpenAI API key is valid
- Make sure you have credits in your OpenAI account
- Check the Edge Function logs in Supabase Dashboard

### Function not being called
- Check browser console for errors
- Verify the function name is `generate-prompts` (matches the folder name)
- Make sure the function is deployed: `supabase functions list`

## Local Development (Optional)

To test locally before deploying:

```bash
# Start local Supabase
supabase start

# Set local secret
supabase secrets set OPENAI_API_KEY=your-key --local

# Test the function
supabase functions serve generate-prompts
```

Then test with:
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-prompts' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"content":"This is a test journal entry with enough content to generate a prompt."}'
```

