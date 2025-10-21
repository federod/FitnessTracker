import { pgTable, text, serial, integer, real, timestamp, date, pgEnum } from 'drizzle-orm/pg-core'

// Enums
export const mealTypeEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack'])
export const exerciseTypeEnum = pgEnum('exercise_type', ['cardio', 'strength', 'flexibility', 'sports', 'knees-over-toes', 'plyos'])
export const genderEnum = pgEnum('gender', ['male', 'female', 'other'])
export const activityLevelEnum = pgEnum('activity_level', ['sedentary', 'light', 'moderate', 'active', 'very-active'])
export const goalEnum = pgEnum('goal', ['lose', 'maintain', 'gain'])
export const unitSystemEnum = pgEnum('unit_system', ['metric', 'imperial'])

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// User profiles table
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  age: integer('age').notNull(),
  gender: genderEnum('gender').notNull(),
  height: real('height').notNull(), // in cm
  weight: real('weight').notNull(), // in kg
  activityLevel: activityLevelEnum('activity_level').notNull(),
  goal: goalEnum('goal').notNull(),
  targetWeight: real('target_weight'),
  unitSystem: unitSystemEnum('unit_system').notNull().default('metric'), // metric or imperial
  useCustomMacros: integer('use_custom_macros').notNull().default(0), // 0 = use calculated, 1 = use custom
  customCalories: integer('custom_calories').default(0),
  customProtein: integer('custom_protein').default(0),
  customCarbs: integer('custom_carbs').default(0),
  customFat: integer('custom_fat').default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Food items table
export const foodItems = pgTable('food_items', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id), // null for default foods
  name: text('name').notNull(),
  calories: real('calories').notNull(),
  protein: real('protein').notNull(),
  carbs: real('carbs').notNull(),
  fat: real('fat').notNull(),
  servingSize: text('serving_size').notNull(),
  isCustom: integer('is_custom').notNull().default(0), // 0 = default, 1 = custom
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Food entries table
export const foodEntries = pgTable('food_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  foodItemId: integer('food_item_id').references(() => foodItems.id).notNull(),
  servings: real('servings').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Exercises table
export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  type: exerciseTypeEnum('type').notNull(),
  duration: integer('duration').notNull(), // in minutes
  caloriesBurned: integer('calories_burned').notNull(),
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Weight history table for tracking weight changes over time
export const weightHistory = pgTable('weight_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  weight: real('weight').notNull(), // in kg
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert
export type FoodItem = typeof foodItems.$inferSelect
export type NewFoodItem = typeof foodItems.$inferInsert
export type FoodEntry = typeof foodEntries.$inferSelect
export type NewFoodEntry = typeof foodEntries.$inferInsert
export type Exercise = typeof exercises.$inferSelect
export type NewExercise = typeof exercises.$inferInsert
export type WeightHistory = typeof weightHistory.$inferSelect
export type NewWeightHistory = typeof weightHistory.$inferInsert
