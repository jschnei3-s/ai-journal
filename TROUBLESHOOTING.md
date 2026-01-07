# Troubleshooting Database Issues

## Issue: "new row violates row-level security policy"

This error means the RLS policy is blocking the insert. Common causes:

### 1. User Profile Doesn't Exist

If you signed in **before** running the schema, your profile wasn't auto-created. Fix it:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your user and copy the **UUID** (it looks like: `123e4567-e89b-12d3-a456-426614174000`)
3. Go to **SQL Editor** and run:

```sql
INSERT INTO public.users (id, email, subscription_status)
VALUES ('YOUR_UUID_HERE', 'your-email@example.com', 'free')
ON CONFLICT (id) DO NOTHING;
```

Replace `YOUR_UUID_HERE` with your actual UUID and `your-email@example.com` with your email.

### 2. Verify Your User Profile Exists

Run this query in SQL Editor to check:

```sql
SELECT * FROM public.users;
```

You should see your user. If not, follow step 1 above.

### 3. Check RLS Policies Are Enabled

Run this to verify:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'journal_entries', 'ai_prompts');
```

All should show `t` (true) for `rowsecurity`.

### 4. Verify Policies Exist

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'journal_entries', 'ai_prompts');
```

You should see policies like:
- "Users can view own profile"
- "Users can create own entries"
- etc.

### 5. Test RLS Policy Directly

Run this (replace with your actual user UUID):

```sql
-- Set the auth context (for testing)
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'YOUR_UUID_HERE';

-- Try to insert (this should work if RLS is correct)
INSERT INTO public.journal_entries (user_id, content)
VALUES ('YOUR_UUID_HERE', 'Test entry');
```

If this fails, the RLS policy might need adjustment.

## Quick Fix Script

Run this in SQL Editor to:
1. Create your user profile if it doesn't exist
2. Verify tables and policies

```sql
-- Get your user UUID from auth.users
DO $$
DECLARE
    user_uuid UUID;
    user_email TEXT;
BEGIN
    -- Get the first authenticated user (you)
    SELECT id, email INTO user_uuid, user_email
    FROM auth.users
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Create profile if it doesn't exist
    INSERT INTO public.users (id, email, subscription_status)
    VALUES (user_uuid, user_email, 'free')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'User profile created/verified for: %', user_email;
END $$;

-- Verify
SELECT * FROM public.users;
```



