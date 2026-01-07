# Backend Setup Guide

## Step 1: Create Database Schema ✅

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase-schema.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

## Step 2: Configure Google OAuth (Optional but Recommended)

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to enable it
3. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Set application type to "Web application"
   - Add authorized redirect URI: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret
4. Back in Supabase, paste the Client ID and Client Secret
5. Click **Save**

## Step 3: Test the Setup

After updating the code (see below), restart your dev server:

```bash
npm run dev
```

Then:
1. Go to http://localhost:3000
2. Try to sign in with Google (if configured) or the app will work in dev mode
3. Create a journal entry
4. Check your Supabase dashboard → Table Editor → `journal_entries` to see your data!

## What's Being Updated

The following files will be updated to use real Supabase:
- `lib/hooks/useJournal.ts` - Real database calls
- `contexts/AuthContext.tsx` - Real user profile fetching
- `contexts/SubscriptionContext.tsx` - Real subscription data



