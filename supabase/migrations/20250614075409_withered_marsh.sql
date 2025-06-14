/*
  # Fix subscription schema and add subscription levels

  1. Database Schema Updates
    - Add subscription_level column to stripe_subscriptions
    - Add proper indexes for performance
    - Update RLS policies for subscription access
    - Add subscription level enum

  2. Security
    - Enable RLS on all tables
    - Add policies for subscription level access
    - Ensure proper user isolation

  3. Subscription Management
    - Track subscription levels (free, premium, ultimate)
    - Add usage tracking per subscription level
    - Add subscription status management
*/

-- Create subscription level enum
DO $$ BEGIN
    CREATE TYPE subscription_level AS ENUM ('free', 'premium', 'ultimate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update stripe_subscriptions table to include subscription level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'subscription_level'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN subscription_level subscription_level DEFAULT 'free';
  END IF;
END $$;

-- Add monthly usage limits table
CREATE TABLE IF NOT EXISTS subscription_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_level subscription_level NOT NULL,
  daily_conversation_minutes integer NOT NULL DEFAULT 0,
  video_call_minutes integer NOT NULL DEFAULT 0,
  subjects_access text[] DEFAULT '{}',
  advanced_analytics boolean DEFAULT false,
  downloadable_transcripts boolean DEFAULT false,
  early_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;

-- Insert default subscription limits
INSERT INTO subscription_limits (subscription_level, daily_conversation_minutes, video_call_minutes, subjects_access, advanced_analytics, downloadable_transcripts, early_access)
VALUES 
  ('free', 30, 0, ARRAY['Math', 'English'], false, false, false),
  ('premium', 240, 30, ARRAY['Math', 'Science', 'English', 'History', 'Languages', 'Test Prep'], true, true, false),
  ('ultimate', -1, 60, ARRAY['Math', 'Science', 'English', 'History', 'Languages', 'Test Prep'], true, true, true)
ON CONFLICT DO NOTHING;

-- Create user subscription view for easy access
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  sc.user_id,
  COALESCE(ss.subscription_level, 'free') as subscription_level,
  ss.status as subscription_status,
  ss.current_period_start,
  ss.current_period_end,
  ss.cancel_at_period_end,
  sl.daily_conversation_minutes,
  sl.video_call_minutes,
  sl.subjects_access,
  sl.advanced_analytics,
  sl.downloadable_transcripts,
  sl.early_access
FROM stripe_customers sc
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id AND ss.deleted_at IS NULL
LEFT JOIN subscription_limits sl ON COALESCE(ss.subscription_level, 'free') = sl.subscription_level
WHERE sc.deleted_at IS NULL;

-- Enable RLS on the view
ALTER VIEW user_subscription_status SET (security_invoker = true);

-- Add RLS policies for subscription_limits
CREATE POLICY "Public can read subscription limits"
  ON subscription_limits
  FOR SELECT
  TO public
  USING (true);

-- Update stripe_subscriptions RLS policy to include subscription level
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id 
      FROM stripe_customers 
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

-- Add policy for user_subscription_status view access
CREATE POLICY "Users can view their own subscription status"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Update user_usage table to track daily usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_usage' AND column_name = 'date'
  ) THEN
    ALTER TABLE user_usage ADD COLUMN date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_usage' AND column_name = 'conversation_minutes'
  ) THEN
    ALTER TABLE user_usage ADD COLUMN conversation_minutes integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_usage' AND column_name = 'video_call_minutes'
  ) THEN
    ALTER TABLE user_usage ADD COLUMN video_call_minutes integer DEFAULT 0;
  END IF;
END $$;

-- Create unique constraint on user_id and date for daily usage tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_usage_user_id_date_key'
  ) THEN
    ALTER TABLE user_usage ADD CONSTRAINT user_usage_user_id_date_key UNIQUE (user_id, date);
  END IF;
END $$;

-- Function to get user's current subscription level
CREATE OR REPLACE FUNCTION get_user_subscription_level(user_uuid uuid)
RETURNS subscription_level
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_level subscription_level;
BEGIN
  SELECT COALESCE(ss.subscription_level, 'free')
  INTO sub_level
  FROM stripe_customers sc
  LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id 
    AND ss.status = 'active' 
    AND ss.deleted_at IS NULL
  WHERE sc.user_id = user_uuid 
    AND sc.deleted_at IS NULL;
  
  RETURN COALESCE(sub_level, 'free');
END;
$$;

-- Function to check if user has access to feature
CREATE OR REPLACE FUNCTION user_has_access(user_uuid uuid, feature_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_level subscription_level;
  has_access boolean := false;
BEGIN
  sub_level := get_user_subscription_level(user_uuid);
  
  CASE feature_name
    WHEN 'premium' THEN
      has_access := sub_level IN ('premium', 'ultimate');
    WHEN 'ultimate' THEN
      has_access := sub_level = 'ultimate';
    WHEN 'video_calls' THEN
      has_access := sub_level IN ('premium', 'ultimate');
    WHEN 'advanced_analytics' THEN
      has_access := sub_level IN ('premium', 'ultimate');
    WHEN 'downloadable_transcripts' THEN
      has_access := sub_level IN ('premium', 'ultimate');
    WHEN 'early_access' THEN
      has_access := sub_level = 'ultimate';
    ELSE
      has_access := true; -- Default to true for unknown features
  END CASE;
  
  RETURN has_access;
END;
$$;

-- Function to track daily usage
CREATE OR REPLACE FUNCTION track_daily_usage(
  user_uuid uuid,
  conversation_mins integer DEFAULT 0,
  video_mins integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_usage (user_id, date, conversation_minutes, video_call_minutes, updated_at)
  VALUES (user_uuid, CURRENT_DATE, conversation_mins, video_mins, now())
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    conversation_minutes = user_usage.conversation_minutes + EXCLUDED.conversation_minutes,
    video_call_minutes = user_usage.video_call_minutes + EXCLUDED.video_call_minutes,
    updated_at = now();
END;
$$;

-- Function to check daily usage limits
CREATE OR REPLACE FUNCTION check_daily_usage_limit(
  user_uuid uuid,
  usage_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_level subscription_level;
  daily_limit integer;
  current_usage integer;
BEGIN
  sub_level := get_user_subscription_level(user_uuid);
  
  -- Get the daily limit for the subscription level
  SELECT 
    CASE 
      WHEN usage_type = 'conversation' THEN daily_conversation_minutes
      WHEN usage_type = 'video' THEN video_call_minutes
      ELSE 0
    END
  INTO daily_limit
  FROM subscription_limits
  WHERE subscription_level = sub_level;
  
  -- If limit is -1, it means unlimited
  IF daily_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Get current usage for today
  SELECT 
    CASE 
      WHEN usage_type = 'conversation' THEN COALESCE(conversation_minutes, 0)
      WHEN usage_type = 'video' THEN COALESCE(video_call_minutes, 0)
      ELSE 0
    END
  INTO current_usage
  FROM user_usage
  WHERE user_id = user_uuid AND date = CURRENT_DATE;
  
  current_usage := COALESCE(current_usage, 0);
  
  RETURN current_usage < daily_limit;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_level 
  ON stripe_subscriptions(customer_id, subscription_level) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_usage_user_date 
  ON user_usage(user_id, date);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id 
  ON stripe_customers(user_id) 
  WHERE deleted_at IS NULL;