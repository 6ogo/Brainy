/*
  # Fix user_usage table schema for daily tracking

  1. Schema Changes
    - Remove the old `minutes_used` column
    - Ensure `date`, `conversation_minutes`, and `video_call_minutes` columns exist
    - Update unique constraint to use `user_id, date` instead of `user_id, month_year`
    
  2. Data Migration
    - Preserve existing data where possible
    - Clean up any constraint conflicts
*/

-- First, check if the new columns exist and add them if they don't
DO $$
BEGIN
  -- Add date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_usage' AND column_name = 'date'
  ) THEN
    ALTER TABLE user_usage ADD COLUMN date date DEFAULT CURRENT_DATE;
  END IF;

  -- Add conversation_minutes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_usage' AND column_name = 'conversation_minutes'
  ) THEN
    ALTER TABLE user_usage ADD COLUMN conversation_minutes integer DEFAULT 0;
  END IF;

  -- Add video_call_minutes column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_usage' AND column_name = 'video_call_minutes'
  ) THEN
    ALTER TABLE user_usage ADD COLUMN video_call_minutes integer DEFAULT 0;
  END IF;
END $$;

-- Migrate existing data from minutes_used to conversation_minutes if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_usage' AND column_name = 'minutes_used'
  ) THEN
    -- Update conversation_minutes with existing minutes_used data
    UPDATE user_usage 
    SET conversation_minutes = COALESCE(minutes_used, 0)
    WHERE conversation_minutes = 0 AND minutes_used IS NOT NULL;
  END IF;
END $$;

-- Drop the old unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_usage' 
    AND constraint_name = 'user_usage_user_id_month_year_key'
  ) THEN
    ALTER TABLE user_usage DROP CONSTRAINT user_usage_user_id_month_year_key;
  END IF;
END $$;

-- Add the new unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_usage' 
    AND constraint_name = 'user_usage_user_id_date_key'
  ) THEN
    ALTER TABLE user_usage ADD CONSTRAINT user_usage_user_id_date_key UNIQUE (user_id, date);
  END IF;
END $$;

-- Remove the old minutes_used column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_usage' AND column_name = 'minutes_used'
  ) THEN
    ALTER TABLE user_usage DROP COLUMN minutes_used;
  END IF;
END $$;

-- Ensure all new columns have proper defaults and constraints
ALTER TABLE user_usage 
  ALTER COLUMN date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN conversation_minutes SET DEFAULT 0,
  ALTER COLUMN video_call_minutes SET DEFAULT 0;

-- Update any null values to defaults
UPDATE user_usage 
SET 
  date = COALESCE(date, CURRENT_DATE),
  conversation_minutes = COALESCE(conversation_minutes, 0),
  video_call_minutes = COALESCE(video_call_minutes, 0)
WHERE date IS NULL OR conversation_minutes IS NULL OR video_call_minutes IS NULL;