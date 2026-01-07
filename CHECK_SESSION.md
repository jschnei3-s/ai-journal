# Quick Session Check

To check if you have a valid session, open your browser console (F12) and run:

```javascript
// Check if you have a session stored
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
  const [name, value] = cookie.trim().split('=');
  acc[name] = value;
  return acc;
}, {});

// Look for Supabase auth cookies
const authCookies = Object.keys(cookies).filter(key => key.includes('auth-token'));
console.log("Auth cookies found:", authCookies.length > 0 ? "Yes" : "No");
console.log("Cookie names:", authCookies);

// Or simply check if you're on a protected page
// If you can see the journal editor, you're authenticated
```

## Simpler Check

Just try:
1. **Sign out** of the app
2. **Sign back in** with Google
3. **Try the journal editor again**

If your session expired, this will refresh it.

## Check Edge Function Logs

The most important thing is to check the Edge Function logs:
1. Supabase Dashboard → Edge Functions → `generate-prompts` → **Logs**
2. Look for the most recent error
3. Share that error message

The logs will tell us exactly what's wrong!



