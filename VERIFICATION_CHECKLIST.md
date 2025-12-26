# ✅ Verification Checklist

Use this checklist to verify everything is working correctly.

## Before Deployment

- [ ] `api/` folder exists with these files:
  - [ ] `api/health.js`
  - [ ] `api/users.js`
  - [ ] `api/lib/supabase.js`
  - [ ] `api/package.json`

- [ ] `vercel.json` exists in project root
- [ ] `supabase-schema.sql` exists in project root

## Supabase Setup

- [ ] Supabase account created
- [ ] Project created in Supabase
- [ ] SQL schema executed successfully (no errors)
- [ ] Tables visible in Supabase Table Editor:
  - [ ] `users` table exists
  - [ ] `spin_logs` table exists
- [ ] Test data visible in `users` table (2 rows)

## Environment Variables

- [ ] `SUPABASE_URL` copied from Supabase (Project Settings → API)
- [ ] `SUPABASE_ANON_KEY` copied from Supabase (Project Settings → API)
- [ ] Both variables added to Vercel (Settings → Environment Variables)
- [ ] Both variables enabled for "Production" environment

## Vercel Deployment

- [ ] Vercel CLI installed (`vercel --version` works)
- [ ] Logged into Vercel (`vercel login` completed)
- [ ] Project linked to Vercel (`vercel` command completed)
- [ ] Deployment successful (no errors in terminal)
- [ ] Deployment URL received (e.g., `https://wheeleat-xxxxx.vercel.app`)

## API Testing

### Test 1: Health Endpoint
- [ ] Open: `https://your-project.vercel.app/api/health`
- [ ] Response shows: `{"status":"ok","message":"WheelEat API is running",...}`
- [ ] No errors in browser console

### Test 2: Users Endpoint
- [ ] Open: `https://your-project.vercel.app/api/users`
- [ ] Response shows: `{"success":true,"count":2,"users":[...]}`
- [ ] Users array contains 2 items (John Doe and Jane Smith)
- [ ] No errors in browser console

## Troubleshooting

If any test fails:

1. **Health endpoint fails:**
   - Check Vercel deployment logs
   - Verify `api/health.js` exists
   - Redeploy: `vercel --prod`

2. **Users endpoint fails:**
   - Check Supabase tables exist
   - Verify environment variables in Vercel
   - Check Vercel deployment logs for errors
   - Redeploy: `vercel --prod`

3. **CORS errors:**
   - Verify you're using HTTPS URL (not HTTP)
   - Check endpoint URLs are correct

## Success Criteria

✅ **Everything works if:**
- Health endpoint returns `{"status":"ok"}`
- Users endpoint returns data with 2 users
- No errors in browser console
- No errors in Vercel deployment logs

---

**If all items are checked, your backend is fully working! 🎉**

