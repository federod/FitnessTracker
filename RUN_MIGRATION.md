# How to Run Database Migration

## Quick Method (Recommended)

Run this command from the project root:

```bash
DATABASE_URL="postgresql://neondb_owner:npg_OitYChM18rAG@ep-blue-bird-aevuhu6p.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require" node scripts/run-migrations.js
```

## What This Does

The migration will:
1. ✅ Create the `weight_history` table (if not exists)
2. ✅ Add custom macro columns to user_profiles (if not exists)
3. ✅ Add new exercise types: `knees-over-toes` and `plyos`

## Expected Output

You should see:
```
🔗 Connecting to Neon database...

📝 Running Migration 1: Create weight_history table...
✅ weight_history table created (or already exists)

📝 Running Migration 2: Add custom macro columns...
✅ Added column: use_custom_macros
✅ Added column: custom_calories
...

📝 Running Migration 3: Add new exercise types...
✅ Added exercise type: knees-over-toes
✅ Added exercise type: plyos

🎉 All migrations completed successfully!
📊 Database is ready to use!
```

## Alternative: Use Netlify CLI

If you have Netlify CLI installed:

```bash
netlify dev
```

Then in another terminal:
```bash
npm run build
```

This will trigger the migration as part of the build process.

## Verify Migration Worked

After running, check the Netlify deploy logs or try accessing the History page - the 500 errors should be gone!

## Troubleshooting

If you see errors like "already exists", that's OK! It means those parts of the migration already ran.

The important part is that it completes with:
```
🎉 All migrations completed successfully!
```
