# Netlify Environment Variables Check

## CRITICAL: Check if DATABASE_URL is set in Netlify

1. Go to https://app.netlify.com
2. Click on your site "fedefitnesspartner"
3. Go to **Site settings** → **Environment variables**
4. Look for `DATABASE_URL`

### If DATABASE_URL is MISSING or WRONG:

Click "Add a variable" and set:

**Key:** `DATABASE_URL`

**Value:**
```
postgresql://neondb_owner:npg_OitYChM18rAG@ep-blue-bird-aevuhu6p.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

**Scopes:** Check ALL boxes:
- ✅ All scopes
- ✅ Production deploys
- ✅ Deploy previews
- ✅ Branch deploys

### After Setting the Variable:

1. Click "Save"
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Clear cache and deploy site**
4. Wait for build to complete

## Also Check These Variables:

Make sure these are also set:

- `JWT_SECRET`: Should exist (any random string)
- `ANTHROPIC_API_KEY`: If you're using Claude features

## Why This Matters

The 502 Bad Gateway error means the functions can't connect to the database because DATABASE_URL is missing or wrong in Netlify's production environment.

Even though .env works locally, Netlify doesn't use your .env file - it needs the variables set in its dashboard!
