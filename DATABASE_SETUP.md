# Database Setup Instructions

## Step 1: Get Your Neon Database URL

1. Go to your Neon dashboard: https://console.neon.tech
2. Select your project or create a new one
3. Go to the "Connection Details" section
4. Copy the **connection string** - it should look like:
   ```
   postgresql://username:password@host.neon.tech/database?sslmode=require
   ```

## Step 2: Set Up Environment Variables

### For Local Development:

Your `.env` file has already been created with the correct values:

```env
DATABASE_URL=postgresql://neondb_owner:npg_OitYChM18rAG@ep-blue-bird-aevuhu6p.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
JWT_SECRET=AuVoCdpE989fYAFSAPiFLxX/eck2GnlN30W3wdAOxGY=
```

### For Netlify Deployment:

1. Go to your Netlify site dashboard: https://app.netlify.com/projects/fedefitnesspartner/configuration/env
2. Add these **NEW** variables (in addition to the existing NETLIFY_DATABASE_URL):
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_OitYChM18rAG@ep-blue-bird-aevuhu6p.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require`
   - `JWT_SECRET`: `AuVoCdpE989fYAFSAPiFLxX/eck2GnlN30W3wdAOxGY=`
3. Make sure both are set to **"All scopes"**
4. Click **Save**

## Step 3: Generate and Run Migrations

✅ **Already completed!** The database schema has been successfully migrated to your Neon database.

All tables have been created:
- ✓ users
- ✓ user_profiles
- ✓ food_items
- ✓ food_entries
- ✓ exercises

If you need to run migrations again in the future:
```bash
npx tsx scripts/run-migration.ts
```

## Step 4: Seed Default Food Items (Optional)

The app will automatically seed default food items when the first user signs up, but you can also run a manual seed if needed.

## Database Schema

The following tables will be created:

### `users`
- id (primary key)
- email (unique)
- password (hashed)
- name
- created_at
- updated_at

### `user_profiles`
- id (primary key)
- user_id (foreign key → users)
- age, gender, height, weight
- activity_level, goal, target_weight
- updated_at

### `food_items`
- id (primary key)
- user_id (nullable - null for default foods)
- name, calories, protein, carbs, fat
- serving_size, is_custom
- created_at

### `food_entries`
- id (primary key)
- user_id (foreign key → users)
- food_item_id (foreign key → food_items)
- servings, meal_type, date
- created_at

### `exercises`
- id (primary key)
- user_id (foreign key → users)
- name, type, duration, calories_burned
- date, notes
- created_at

## Next Steps

To complete the deployment:

1. **Add environment variables to Netlify** (see Step 2 above)
2. **Redeploy your site** - Either:
   - Push any change to GitHub (automatic deploy), OR
   - Go to Netlify dashboard → Deploys → Trigger deploy
3. **Test the authentication** - Visit your site and try signing up!

The authentication system is now fully configured and ready to use! 🎉
