# Claude API Testing Guide

Now that you've added the `ANTHROPIC_API_KEY` to Netlify, here's how to test each feature:

## ✅ Test 1: Food Nutrition Lookup

1. Go to **Food Log** page
2. Click **+ Add** on any meal (Breakfast, Lunch, Dinner, or Snacks)
3. Type in the search box: **"grilled chicken breast with bbq sauce"**
4. Wait 2-3 seconds
5. ✅ **Expected**: Claude should return nutrition info for grilled chicken with sauce
6. ❌ **If it fails**: Check Netlify function logs for errors

**Advanced test**: Try complex foods like "2 scrambled eggs with cheese" or "homemade protein shake"

---

## ✅ Test 2: Exercise Suggestions

1. Go to **Exercise Log** page
2. Click **+ Add Exercise**
3. In the modal, select:
   - **Muscle Group**: Biceps
   - **Difficulty**: Intermediate
4. Wait 2-3 seconds
5. ✅ **Expected**: Claude should return 10 bicep exercises at intermediate level
6. Click on any exercise to see instructions

**Advanced test**: Try different muscle groups like "chest" or "legs"

---

## ✅ Test 3: Recipe Search

1. Go to **Recipes** page (in top navigation)
2. Type in search box: **"chicken"**
3. Wait 2-3 seconds
4. ✅ **Expected**: Claude should return 10 chicken recipes
5. Click on a recipe to see full ingredients and instructions

**Advanced test**: Search for "keto" or "high protein" recipes

---

## 🔍 How to Check if API is Working

### Check Netlify Function Logs:
1. Go to Netlify dashboard
2. Click on your site
3. Go to **Functions** tab
4. Click on **claude-nutrition**, **claude-exercise**, or **claude-recipe**
5. Check the logs for successful calls

### Cost Tracking:
- Each food lookup: ~$0.01
- Each exercise search: ~$0.015
- Each recipe search: ~$0.02
- Daily usage with moderate use: ~$0.50-$1.00

---

## 🐛 Troubleshooting

**Problem**: "Anthropic API key not configured"
- **Solution**: Make sure ANTHROPIC_API_KEY is added to Netlify environment variables and redeploy

**Problem**: Search returns error after 30 seconds
- **Solution**: Netlify functions timeout after 10 seconds on free tier. The queries should complete in 2-3 seconds.

**Problem**: API key invalid
- **Solution**: Double-check the API key in Netlify matches the one from Anthropic console

---

## 💡 What Makes Claude Better

**Food Nutrition:**
- Ninja API: Only recognized exact food names
- Claude: Understands context like "with sauce" or "grilled" vs "fried"

**Exercise Suggestions:**
- Ninja API: Sometimes returns irrelevant exercises
- Claude: Contextually relevant exercises with clear instructions

**Recipes:**
- Ninja API: Limited recipe database
- Claude: Can generate creative, practical recipes on demand

---

## Next Steps After Testing

Once everything works:
1. Merge this branch to main
2. Use branches for all future features
3. Monitor API costs in Anthropic console
4. Consider adding fiber tracking to nutrition data

---

## Environment Variable Check

Make sure in Netlify:
- Variable name is exactly: `ANTHROPIC_API_KEY` (all caps, with underscores)
- Value starts with: `sk-ant-api03-`
- Scopes: "All deploys" or "All scopes"
- After adding, you MUST redeploy (or trigger a new deploy)
