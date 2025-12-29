# Understanding User Profiles in Supabase

## Two Different User Tables

In Supabase, there are **two separate user-related tables**:

### 1. `auth.users` (Authentication Table)
- **Managed by Supabase Auth** - you don't create this table
- **Automatically created** when you sign in with Google OAuth
- Contains: `id`, `email`, `created_at`, etc.
- This is your **authentication account**

### 2. `public.users` (Application Profile Table)
- **Custom table we created** in the schema
- Stores additional app-specific data:
  - `subscription_status` (free/premium)
  - `email` (copied from auth.users)
  - `created_at`
- This is your **application profile**

## Why Two Tables?

- `auth.users` is for authentication (managed by Supabase)
- `public.users` is for your app's data (subscription status, preferences, etc.)

## The Problem: Profile Doesn't Exist

When you sign in, Supabase creates a record in `auth.users` automatically. However, your profile in `public.users` is only created if:

1. **You signed up AFTER running the schema** - A trigger automatically creates it
2. **OR you manually create it** - Using the fix script

### What Happens If Profile Doesn't Exist?

- ✅ You can still sign in (auth.users exists)
- ❌ The app can't fetch your subscription status
- ❌ You might get errors when trying to save journal entries (depending on RLS setup)

## How to Check

Run this in Supabase SQL Editor:

```sql
-- Check if you exist in auth.users (should always be true if you're signed in)
SELECT id, email, created_at FROM auth.users;

-- Check if you exist in public.users (this might be missing)
SELECT id, email, subscription_status FROM public.users;
```

If the second query returns nothing, your profile doesn't exist and you need to create it.

## The Fix

Run `fix-user-profile.sql` which will:
1. Find your user in `auth.users`
2. Create a corresponding record in `public.users`
3. Set your subscription status to "free"

## Important Note About Journal Entries

The `journal_entries` table actually references `auth.users` directly (not `public.users`), so the RLS error might be a different issue. However, having your profile in `public.users` is still important for the app to work correctly.

