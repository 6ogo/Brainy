/*
  # Create User Preferences Table

  1. New Tables
    - `user_preferences`
      - `user_id` (uuid, primary key, references auth.users)
      - `has_completed_onboarding` (boolean)
      - `show_onboarding` (boolean)
      - `subjects` (text array)
      - `learning_goal` (text)
      - `preferred_schedule` (text)
      - `difficulty_level` (text)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_preferences` table
    - Add policies for authenticated users to:
      - Select their own preferences
      - Insert their own preferences
      - Update their own preferences
*/

-- Create the user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_completed_onboarding boolean DEFAULT FALSE,
  show_onboarding boolean DEFAULT TRUE,
  subjects text[] DEFAULT '{}',
  learning_goal text,
  preferred_schedule text,
  difficulty_level text,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create an index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);