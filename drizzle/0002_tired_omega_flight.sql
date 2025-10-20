ALTER TABLE "user_profiles" ADD COLUMN "use_custom_macros" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "custom_calories" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "custom_protein" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "custom_carbs" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "custom_fat" integer DEFAULT 0;