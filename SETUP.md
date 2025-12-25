# Setup Instructions

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project
- Google OAuth credentials (for authentication)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   You can find these values in your Supabase project settings under API.

3. **Configure Google OAuth in Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials
   - Set the redirect URL to: `http://localhost:3000/callback` (for development)

4. **Set up Supabase Database:**
   
   Run the following SQL in your Supabase SQL editor to create the necessary tables:
   
   ```sql
   -- Create users table (extends Supabase auth.users)
   CREATE TABLE public.users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT NOT NULL,
     subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create journal_entries table
   CREATE TABLE public.journal_entries (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create ai_prompts table
   CREATE TABLE public.ai_prompts (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     entry_id UUID REFERENCES public.journal_entries(id) ON DELETE CASCADE NOT NULL,
     prompt_text TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

   -- Create policies for users table
   CREATE POLICY "Users can view own profile"
     ON public.users FOR SELECT
     USING (auth.uid() = id);

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
     VALUES (NEW.id, NEW.email);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

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

   -- Create trigger for journal_entries
   CREATE TRIGGER update_journal_entries_updated_at
     BEFORE UPDATE ON public.journal_entries
     FOR EACH ROW
     EXECUTE FUNCTION public.update_updated_at_column();
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app
  /(auth)          # Authentication pages
  /(dashboard)     # Protected dashboard pages
/components        # React components
/lib               # Utilities and helpers
/contexts          # React context providers
/providers         # App-level providers
```

## Next Steps

- Phase 1 is complete! The foundation is set up.
- Continue with Phase 2: Journaling Core features
- See `frontend-plan.md` for the complete development roadmap

## Troubleshooting

- **Authentication not working**: Check that Google OAuth is properly configured in Supabase and the redirect URL matches
- **Database errors**: Ensure RLS policies are set up correctly
- **Type errors**: Run `npm install` to ensure all dependencies are installed

