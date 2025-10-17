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

Create a `.env` file in the project root:

```env
DATABASE_URL=your_neon_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here
```

### For Netlify Deployment:

1. Go to your Netlify site dashboard
2. Go to **Site settings** → **Environment variables**
3. Add these variables:
   - `DATABASE_URL`: Your Neon connection string
   - `JWT_SECRET`: A random secret key for JWT tokens (generate one with: `openssl rand -base64 32`)

## Step 3: Generate and Run Migrations

Run these commands to create the database tables:

```bash
# Generate migration files
npx drizzle-kit generate

# Push the schema to your database
npx drizzle-kit push
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

After setting up the database:
1. Update Netlify with the environment variables
2. Redeploy your site
3. The authentication system will be ready to use!
