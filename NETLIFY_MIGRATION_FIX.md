# Netlify Migration Troubleshooting

## Current Issue
The production site is getting 500 errors because the database migration hasn't run on Netlify yet.

## Quick Fix - Trigger Manual Netlify Deploy

### Option 1: From Netlify Dashboard
1. Go to https://app.netlify.com
2. Find your site "fedefitnesspartner"
3. Click "Deploys" tab
4. Click "Trigger deploy" → "Clear cache and deploy site"
5. Watch the deploy logs for migration output

### Option 2: From Command Line
```bash
# Make an empty commit to trigger deploy
git commit --allow-empty -m "Trigger Netlify redeploy for migration"
git push origin main
```

## What to Look For in Deploy Logs

In the Netlify deploy logs, you should see:

```
🔗 Connecting to Neon database...
📍 Database host: ep-blue-bird-aevuhu6p.c-2.us-east-2.aws.neon.tech

📝 Running Migration 1: Create weight_history table...
✅ weight_history table created

📝 Running Migration 2: Add custom macro columns...
✅ Added column: use_custom_macros
...

📝 Running Migration 3: Add new exercise types...
✅ Added exercise type: knees-over-toes
✅ Added exercise type: plyos

🎉 All migrations completed successfully!
```

## If Migration Fails

### Check Database URL
In Netlify UI → Site settings → Environment variables:
- Verify `DATABASE_URL` is set correctly
- Should start with: `postgresql://neondb_owner:...`

### Common Issues

**Issue:** "DATABASE_URL not found"
- **Fix:** Make sure DATABASE_URL is set in Netlify environment variables (not just in deploy previews)

**Issue:** "Connection timeout"
- **Fix:** Check Neon database is accessible and not paused

**Issue:** "Enum value already exists"
- **Fix:** This is OK! It means migration already ran partially

## Verify Fix Worked

After successful deploy:
1. Visit https://fedefitnesspartner.netlify.app/history
2. Check browser console - 500 errors should be gone
3. Weekly/Monthly/Weight tabs should load data

## Manual Migration (Last Resort)

If Netlify builds keep failing, you can run the migration manually:

```bash
# From your local machine (already done successfully)
DATABASE_URL="postgresql://..." node scripts/run-migrations.js
```

The migration connects to the SAME database Netlify uses, so running it locally fixes production too!
