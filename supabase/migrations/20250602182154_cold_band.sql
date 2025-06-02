/*
  # Create conversations and usage tracking tables

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `user_message` (text)
      - `ai_response` (text)
      - `duration` (integer, in seconds)
      - `timestamp` (timestamptz)
    
    - `user_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `month_year` (text, format: 'YYYY-MM')
      - `minutes_used` (integer)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read/write their own data
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  user_message text NOT NULL,
  ai_response text NOT NULL,
  duration integer DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS and create policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create user_usage table
CREATE TABLE IF NOT EXISTS user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  month_year text NOT NULL,
  minutes_used integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS and create policies for user_usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON user_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON user_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON user_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);