# Database Setup Guide

## Quick Setup Steps

You need to run the database schema in your Supabase project. Here's how:

### 1. Open Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### 2. Run the Schema

1. Open the file `supabase-schema.sql` in this project
2. Copy **ALL** the contents
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### 3. Verify Tables Were Created

After running the SQL, verify the tables exist:

1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - `users`
   - `journal_entries`
   - `ai_prompts`

### 4. Create Your User Profile (if needed)

If you signed in before running the schema, you may need to manually create your user profile:

1. Go to **Authentication** → **Users** in Supabase
2. Find your user and copy their UUID
3. Go to **SQL Editor** and run:

```sql
INSERT INTO public.users (id, email, subscription_status)
VALUES ('YOUR_USER_UUID_HERE', 'your-email@example.com', 'free')
ON CONFLICT (id) DO NOTHING;
```

Replace `YOUR_USER_UUID_HERE` with your actual user UUID and `your-email@example.com` with your email.

### 5. Test the App

1. Refresh your app in the browser
2. Try creating a journal entry
3. It should save successfully!

## What the Schema Creates

- **`users` table**: Stores user profiles with subscription status
- **`journal_entries` table**: Stores journal entries
- **`ai_prompts` table**: Stores AI prompts for entries
- **Row Level Security (RLS) policies**: Ensures users can only access their own data
- **Triggers**: Automatically creates user profiles when someone signs up
- **Indexes**: Improves query performance

## Troubleshooting

### Error: "Could not find the table 'public.users'"
- **Solution**: Run the `supabase-schema.sql` file in Supabase SQL Editor

### Error: "new row violates row-level security policy"
- **Solution**: Make sure you've run the schema and your user profile exists in the `users` table

### Error: "relation does not exist"
- **Solution**: The schema hasn't been run. Follow steps 1-2 above.



