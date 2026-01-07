-- Quick Fix: Create User Profile and Verify Setup
-- Run this in Supabase SQL Editor

-- Step 1: Create your user profile if it doesn't exist
-- This gets your user from auth.users and creates a profile
DO $$
DECLARE
    user_uuid UUID;
    user_email TEXT;
BEGIN
    -- Get the most recently created authenticated user (you)
    SELECT id, email INTO user_uuid, user_email
    FROM auth.users
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found. Please sign in first.';
    END IF;
    
    -- Create profile if it doesn't exist
    INSERT INTO public.users (id, email, subscription_status)
    VALUES (user_uuid, user_email, 'free')
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email; -- Update email if it changed
    
    RAISE NOTICE 'User profile created/verified for: % (UUID: %)', user_email, user_uuid;
END $$;

-- Step 2: Verify your profile exists
SELECT 
    id,
    email,
    subscription_status,
    created_at
FROM public.users;

-- Step 3: Verify RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'journal_entries', 'ai_prompts')
ORDER BY tablename, policyname;

-- Step 4: Test that you can insert (this should work now)
-- Note: This will only work if you're authenticated
-- The RLS policy will automatically use auth.uid() from your session



