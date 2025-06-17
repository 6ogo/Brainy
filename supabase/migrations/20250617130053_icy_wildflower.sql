/*
  # Add analytics and achievement system enhancements

  1. New Tables
    - `user_analytics` - Stores detailed analytics data for users
    - `achievement_progress` - Tracks progress toward achievements
  
  2. Security
    - Enable RLS on both tables
    - Add policies for proper access control
  
  3. Functions
    - Add functions to calculate analytics metrics
    - Add functions to track achievement progress
*/

-- Create user_analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  learning_velocity integer DEFAULT 0,
  engagement_score integer DEFAULT 0,
  consistency_rating text DEFAULT 'Building',
  progress_trend text DEFAULT 'Steady',
  learning_style text DEFAULT 'visual',
  peak_study_time text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on user_analytics
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for user_analytics
CREATE POLICY "Users can view their own analytics"
  ON user_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
  ON user_analytics
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
  ON user_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create achievement_progress table
CREATE TABLE IF NOT EXISTS achievement_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  achievement_id uuid REFERENCES achievements(id) NOT NULL,
  current_value integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on achievement_progress
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for achievement_progress
CREATE POLICY "Users can view their own achievement progress"
  ON achievement_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievement progress"
  ON achievement_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievement progress"
  ON achievement_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to calculate learning velocity
CREATE OR REPLACE FUNCTION calculate_learning_velocity(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_xp integer;
  total_study_time_hours float;
  velocity integer;
BEGIN
  -- Get total XP (mock implementation)
  SELECT COALESCE(SUM(xp_earned), 0)
  INTO total_xp
  FROM study_sessions
  WHERE user_id = user_uuid;
  
  -- Get total study time in hours
  SELECT COALESCE(SUM(duration) / 3600.0, 0)
  INTO total_study_time_hours
  FROM study_sessions
  WHERE user_id = user_uuid;
  
  -- Calculate velocity (XP per hour)
  IF total_study_time_hours > 0 THEN
    velocity := ROUND(total_xp / total_study_time_hours);
  ELSE
    velocity := 0;
  END IF;
  
  RETURN velocity;
END;
$$;

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_time integer;
  total_time integer;
  score integer;
BEGIN
  -- Get active study time (from conversations)
  SELECT COALESCE(SUM(duration), 0)
  INTO active_time
  FROM conversations
  WHERE user_id = user_uuid;
  
  -- Get total logged time
  SELECT COALESCE(SUM(duration), 0)
  INTO total_time
  FROM study_sessions
  WHERE user_id = user_uuid;
  
  -- Calculate engagement score
  IF total_time > 0 THEN
    score := LEAST(100, ROUND((active_time::float / total_time::float) * 100));
  ELSE
    score := 0;
  END IF;
  
  RETURN score;
END;
$$;

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION update_achievement_progress(
  user_uuid uuid,
  achievement_uuid uuid,
  progress_value integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  achievement_record record;
  current_progress integer;
BEGIN
  -- Get achievement details
  SELECT * INTO achievement_record
  FROM achievements
  WHERE id = achievement_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Achievement not found';
  END IF;
  
  -- Get current progress
  SELECT current_value INTO current_progress
  FROM achievement_progress
  WHERE user_id = user_uuid AND achievement_id = achievement_uuid;
  
  -- Insert or update progress
  INSERT INTO achievement_progress (user_id, achievement_id, current_value, updated_at)
  VALUES (user_uuid, achievement_uuid, progress_value, now())
  ON CONFLICT (user_id, achievement_id)
  DO UPDATE SET
    current_value = progress_value,
    updated_at = now();
    
  -- Check if achievement should be unlocked
  IF progress_value >= achievement_record.requirement_value THEN
    -- Check if already unlocked
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements
      WHERE user_id = user_uuid AND achievement_id = achievement_uuid
    ) THEN
      -- Unlock achievement
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
      VALUES (user_uuid, achievement_uuid, now());
    END IF;
  END IF;
END;
$$;

-- Function to get user's learning style
CREATE OR REPLACE FUNCTION get_user_learning_style(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  style text;
BEGIN
  -- Get learning style from analytics
  SELECT learning_style INTO style
  FROM user_analytics
  WHERE user_id = user_uuid;
  
  -- Default to visual if not found
  IF style IS NULL THEN
    style := 'visual';
  END IF;
  
  RETURN style;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_id ON achievement_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_achievement_id ON achievement_progress(achievement_id);