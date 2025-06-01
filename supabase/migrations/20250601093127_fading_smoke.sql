-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public_bolt;

-- Enable RLS
ALTER SCHEMA public_bolt OWNER TO postgres;

-- Users table
CREATE TABLE public_bolt.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMPTZ
);

-- Study sessions table
CREATE TABLE public_bolt.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public_bolt.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0
);

-- Achievements table
CREATE TABLE public_bolt.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public_bolt.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User progress table
CREATE TABLE public_bolt.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public_bolt.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, subject)
);

-- Enable Row Level Security
ALTER TABLE public_bolt.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_bolt.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_bolt.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_bolt.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data"
  ON public_bolt.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON public_bolt.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view their own study sessions"
  ON public_bolt.study_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
  ON public_bolt.study_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON public_bolt.study_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievements"
  ON public_bolt.achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own progress"
  ON public_bolt.user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public_bolt.user_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION public_bolt.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public_bolt.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public_bolt.handle_new_user();