/*
  # Create user trigger for automatic user preferences

  1. New Functions
    - `create_user_preferences` function to automatically create user preferences on signup
  
  2. Triggers
    - Add trigger to auth.users table to call the function on user insert
*/

-- Create function to automatically create user preferences on signup
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, has_completed_onboarding, show_onboarding)
  VALUES (NEW.id, false, true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_preferences();