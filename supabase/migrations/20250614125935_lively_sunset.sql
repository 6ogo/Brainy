/*
  # Fix User Preferences Persistence

  1. Updates
    - Ensures user preferences are properly saved when onboarding is completed
    - Adds missing trigger function to update timestamps
  
  2. Security
    - Maintains existing RLS policies
*/

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to user_preferences table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Ensure all necessary RLS policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' AND policyname = 'Users can insert their own preferences'
  ) THEN
    CREATE POLICY "Users can insert their own preferences"
      ON user_preferences
      FOR INSERT
      TO authenticated
      WITH CHECK (uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' AND policyname = 'Users can update their own preferences'
  ) THEN
    CREATE POLICY "Users can update their own preferences"
      ON user_preferences
      FOR UPDATE
      TO authenticated
      USING (uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' AND policyname = 'Users can view their own preferences'
  ) THEN
    CREATE POLICY "Users can view their own preferences"
      ON user_preferences
      FOR SELECT
      TO authenticated
      USING (uid() = user_id);
  END IF;
END $$;