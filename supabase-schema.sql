-- Supabase Database Schema for AI Journaling App
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_prompts table
CREATE TABLE IF NOT EXISTS public.ai_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE NOT NULL,
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running this script)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can create own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can view prompts for own entries" ON public.ai_prompts;
DROP POLICY IF EXISTS "Users can create prompts for own entries" ON public.ai_prompts;

-- Create policies for users table
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for journal_entries table
CREATE POLICY "Users can view own entries"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own entries"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for ai_prompts table
CREATE POLICY "Users can view prompts for own entries"
  ON public.ai_prompts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries
      WHERE journal_entries.id = ai_prompts.entry_id
      AND journal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create prompts for own entries"
  ON public.ai_prompts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_entries
      WHERE journal_entries.id = ai_prompts.entry_id
      AND journal_entries.user_id = auth.uid()
    )
  );

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to call function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON public.journal_entries;

-- Create trigger for journal_entries
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON public.journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_entry_id ON public.ai_prompts(entry_id);

