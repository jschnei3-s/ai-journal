# Testing Billing Page Locally - Complete Guide

## ✅ Pre-Flight Checklist

Before updating Supabase URLs, verify everything works locally!

### 1. Start Dev Server (if not running)
```bash
npm run dev
```
**Check:** Server should start on `http://localhost:3000`

---

## 2. Test API Route Directly

**Test the Stripe checkout endpoint:**
```bash
curl http://localhost:3000/api/stripe/create-checkout-session
```

**Expected Response (if env vars not set):**
```json
{
  "status": "Route is accessible",
  "stripeConfigured": false,
  "envVars": {
    "STRIPE_SECRET_KEY": "MISSING",
    "STRIPE_PRICE_MONTHLY": "MISSING"
  },
  "stripeInitError": "..."
}
```

✅ **If you see this JSON response, the route is working!**

---

## 3. Test Billing Page Access

**Open in browser:** `http://localhost:3000/billing`

**Expected Behavior:**
- **If NOT logged in:** Automatically redirects to `/login` ✅
- **If logged in:** Shows billing page with:
  - "Current Plan" section
  - "Upgrade to Premium" button
  - "Plan Comparison" section

---

## 4. Test Stripe Checkout Button (When Logged In)

**Steps:**
1. Log in with Google OAuth (if Supabase is configured)
2. Navigate to `/billing`
3. Click "Upgrade to Premium" button

**Expected Behavior:**
- **If Stripe env vars NOT set locally:**
  - Button click shows alert with detailed error message
  - Console shows: `[CHECKOUT] API error response...`
  - Error message tells you exactly what's missing ✅

- **If Stripe env vars ARE set:**
  - Either redirects to Stripe checkout OR
  - Shows specific error about what's wrong (price ID, etc.)

---

## 5. Verify Callback Routes

**Test both callback routes:**
- `http://localhost:3000/callback` - Should load (may redirect)
- `http://localhost:3000/auth/callback` - Should load (may redirect)

✅ **If these routes don't 404, they're configured correctly!**

---

## ✅ Success Criteria for Local Testing

Before updating Supabase production URLs, verify:

- [ ] Dev server runs without errors
- [ ] `/billing` page loads (redirects to login if not authenticated)
- [ ] `/api/stripe/create-checkout-session` GET endpoint returns JSON
- [ ] Clicking "Upgrade to Premium" shows helpful error (if vars not set)
- [ ] No 404 errors in browser console
- [ ] `/callback` route exists and loads

---

## Environment Variables for Full Testing

**Create `.env.local` in project root:**

```env
# Supabase (required for authentication)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe (required for checkout functionality)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PRICE_MONTHLY=price_your_price_id_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Note:** You can test locally WITHOUT Stripe vars - you'll just get helpful error messages when clicking the button.

---

## After Local Testing Works ✅

1. **Update Supabase URLs:**
   - Site URL: `https://ai-journal-5tqv.vercel.app`
   - Redirect URLs: 
     - `http://localhost:3000/callback`
     - `https://ai-journal-5tqv.vercel.app/callback`
     - `https://ai-journal-5tqv.vercel.app/auth/callback`

2. **Wait 1-2 minutes** for changes to propagate

3. **Test on production:** `https://ai-journal-5tqv.vercel.app/billing`

---

## Troubleshooting Local Issues

**If billing page doesn't load:**
- Check browser console for errors
- Verify middleware isn't blocking the route
- Check if Supabase is configured (might redirect to login)

**If checkout button doesn't work:**
- Check browser console for `[CHECKOUT]` logs
- Verify API route is accessible: `curl http://localhost:3000/api/stripe/create-checkout-session`
- Check error message - it will tell you exactly what's wrong

