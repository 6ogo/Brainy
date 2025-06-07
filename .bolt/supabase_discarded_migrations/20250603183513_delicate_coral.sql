-- Drop existing table if it exists
DROP TABLE IF EXISTS public_bolt.user_preferences;

CREATE TABLE public_bolt.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  has_completed_onboarding boolean DEFAULT false,
  show_onboarding boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public_bolt.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences"
  ON public_bolt.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public_bolt.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public_bolt.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public_bolt.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public_bolt.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public_bolt.update_updated_at_column();

-- Create trigger to create preferences on user creation
CREATE OR REPLACE FUNCTION public_bolt.create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public_bolt.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public_bolt.create_user_preferences();

-- Insert preferences for existing users
INSERT INTO public_bolt.user_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;