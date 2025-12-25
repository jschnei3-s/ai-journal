# Backend Setup Notes

## Supabase Project
URL:
https://pougojfhziqbytpxbctm.supabase.co

We are using Supabase for:
- Auth (Google)
- Database (PostgreSQL)
- Row-level security (RLS)
- Edge Functions (AI + Stripe later)

## Tables Created
- journal_entries
- ai_prompts
- user_subscriptions

RLS policies are configured so each user only sees their own data.

## Edge Functions
### generate-prompts
- Input: `{ "entry_id": "UUID" }`
- Auth: uses Supabase auth JWT from the client (`Authorization` header)
- Behavior:
  - Verifies the entry belongs to the logged-in user
  - Reads `journal_entries.content`
  - Calls OpenAI to generate 3–5 follow-up questions
  - Inserts them into `ai_prompts`
  - Returns `{ "prompts": [ "...", "...", "..."] }`

## Environment Variables (Frontend)
Create `.env.local` (not committed):

NEXT_PUBLIC_SUPABASE_URL=https://pougojfhziqbytpxbctm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase>
