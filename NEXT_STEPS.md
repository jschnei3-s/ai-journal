# Next Steps Guide

## 🎉 Current Status

**Frontend is 100% complete!** All UI features are implemented and working with mock data.

## 🚀 Immediate Next Steps

### Option 1: Test & Polish the Frontend (Recommended First)

Before moving to backend, you can:

1. **Test the Application**
   ```bash
   npm run dev
   ```
   - Navigate through all pages
   - Test journal entry creation
   - Try the AI prompts
   - Check responsive design on mobile
   - Test all navigation flows

2. **Add Sample Data for Testing**
   - Create a few journal entries
   - Test search functionality
   - Test entry editing and deletion
   - Verify autosave works

3. **UI/UX Improvements** (Optional)
   - Add animations/transitions
   - Improve loading states
   - Add empty state illustrations
   - Enhance mobile experience
   - Add keyboard shortcuts

4. **Accessibility Audit**
   - Test with screen readers
   - Verify keyboard navigation
   - Check color contrast
   - Add ARIA labels where needed

### Option 2: Backend Integration

When you're ready to connect the backend:

#### Step 1: Set Up Supabase Project

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for project to initialize

2. **Get Your Credentials**
   - Go to Project Settings → API
   - Copy your Project URL
   - Copy your `anon` public key
   - Copy your `service_role` key (keep this secret!)

3. **Update Environment Variables**
   - Edit `.env.local`
   - Replace placeholder values with real Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

#### Step 2: Create Database Schema

Run this SQL in your Supabase SQL Editor:

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

#### Step 3: Configure Google OAuth

1. **In Supabase Dashboard:**
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials:
     - Client ID
     - Client Secret
   - Set redirect URL: `http://localhost:3000/callback` (dev) or your production URL

2. **Get Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs

#### Step 4: Replace Mock Data with Real Backend Calls

**Update these files:**

1. **`lib/hooks/useJournal.ts`**
   - Replace localStorage functions with Supabase calls
   - Use `supabase.from('journal_entries')` for CRUD operations

2. **`lib/hooks/useAIPrompt.ts`**
   - Replace mock `generateAIPrompt` with Edge Function call
   - Call `supabase.functions.invoke('generate-prompt', { body: { content } })`

3. **`contexts/SubscriptionContext.tsx`**
   - Replace localStorage with database queries
   - Fetch subscription status from `users` table

#### Step 5: Create Supabase Edge Function for AI Prompts

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase:**
   ```bash
   supabase init
   ```

3. **Create Edge Function:**
   ```bash
   supabase functions new generate-prompt
   ```

4. **Implement the function** (in `supabase/functions/generate-prompt/index.ts`):
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

   serve(async (req) => {
     const { content } = await req.json()
     
     // Call OpenAI API
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         model: 'gpt-3.5-turbo',
         messages: [{
           role: 'system',
           content: 'You are a thoughtful journaling assistant. Generate reflective questions based on journal entries. Ask questions that encourage deeper self-exploration, not advice.'
         }, {
           role: 'user',
           content: `Based on this journal entry, generate a thoughtful follow-up question: ${content}`
         }],
         max_tokens: 100,
       }),
     })
     
     const data = await response.json()
     return new Response(JSON.stringify({ prompt: data.choices[0].message.content }))
   })
   ```

5. **Deploy the function:**
   ```bash
   supabase functions deploy generate-prompt
   ```

6. **Set environment variables:**
   - In Supabase Dashboard → Edge Functions → Settings
   - Add `OPENAI_API_KEY` secret

#### Step 6: Stripe Integration (Optional)

1. **Create Stripe Account**
   - Sign up at [stripe.com](https://stripe.com)
   - Get your API keys

2. **Update Environment Variables:**
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

3. **Create Checkout Session API Route:**
   - Create `app/api/create-checkout-session/route.ts`
   - Implement Stripe Checkout session creation

4. **Update Billing Components:**
   - Replace alert() with actual Stripe Checkout redirect
   - Handle webhooks for subscription updates

## 📋 Recommended Order

### For Quick Testing:
1. ✅ Test frontend with mock data
2. ✅ Polish UI/UX
3. ✅ Add any missing features

### For Full Backend Integration:
1. Set up Supabase project
2. Create database schema
3. Configure Google OAuth
4. Replace localStorage with Supabase calls
5. Create Edge Function for AI prompts
6. Test end-to-end
7. Add Stripe (optional)
8. Deploy to production

## 🎯 Quick Wins (Can Do Now)

1. **Add More UI Components:**
   - Toast notifications
   - Confirmation dialogs
   - Loading skeletons
   - Empty state illustrations

2. **Enhance Journal Editor:**
   - Markdown support
   - Rich text formatting
   - Export to PDF
   - Word count goals

3. **Add Features:**
   - Entry tags/categories
   - Entry search filters
   - Export entries
   - Dark mode toggle

4. **Improve AI Prompts:**
   - Multiple prompt suggestions
   - Prompt history
   - Custom prompt styles

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🆘 Need Help?

- Check `FRONTEND_STATUS.md` for integration points
- Review `SETUP.md` for detailed setup instructions
- See `frontend-plan.md` for the complete development plan

---

**You're in a great position!** The frontend is solid and ready. You can either:
- **Polish and test** the frontend first (recommended)
- **Jump into backend** integration when ready

Both paths will lead to a fully functional app! 🚀

