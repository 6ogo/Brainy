-- Create the user_preferences table in public_bolt schema
CREATE TABLE IF NOT EXISTS public_bolt.user_preferences (
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
ALTER TABLE public_bolt.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences"
  ON public_bolt.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public_bolt.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public_bolt.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create an index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public_bolt.user_preferences(user_id);

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public_bolt.update_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_preferences_timestamp
  BEFORE UPDATE ON public_bolt.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public_bolt.update_preferences_updated_at();

-- Insert preferences for existing users
INSERT INTO public_bolt.user_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;