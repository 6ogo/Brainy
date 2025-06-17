/*
  # Create achievements system

  1. New Tables
    - `achievements`
      - `id` (uuid, primary key)
      - `title` (text, achievement name)
      - `description` (text, achievement description)
      - `category` (text, category like 'study', 'subject', 'streak', etc.)
      - `icon` (text, icon name for display)
      - `xp_reward` (integer, XP points awarded)
      - `requirement_type` (text, type of requirement)
      - `requirement_value` (integer, value needed to unlock)
      - `created_at` (timestamp)
    
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `achievement_id` (uuid, foreign key to achievements)
      - `unlocked_at` (timestamp)
      - `progress` (integer, current progress towards achievement)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read achievements
    - Add policies for users to read their own user_achievements
*/

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  icon text NOT NULL DEFAULT 'trophy',
  xp_reward integer NOT NULL DEFAULT 0,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements (public read)
CREATE POLICY "Anyone can read achievements"
  ON achievements
  FOR SELECT
  TO public
  USING (true);

-- Policies for user_achievements
CREATE POLICY "Users can read their own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON user_achievements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO achievements (title, description, category, icon, xp_reward, requirement_type, requirement_value) VALUES
-- Study achievements
('First Steps', 'Complete your first conversation', 'study', 'star', 50, 'conversations', 1),
('Chatterbox', 'Complete 10 conversations', 'study', 'message-circle', 100, 'conversations', 10),
('Conversation Master', 'Complete 50 conversations', 'study', 'crown', 250, 'conversations', 50),
('Century Club', 'Complete 100 conversations', 'study', 'trophy', 500, 'conversations', 100),

-- Time-based achievements
('Quick Learner', 'Study for 1 hour total', 'time', 'clock', 75, 'study_minutes', 60),
('Dedicated Student', 'Study for 10 hours total', 'time', 'book-open', 200, 'study_minutes', 600),
('Study Marathon', 'Study for 50 hours total', 'time', 'zap', 500, 'study_minutes', 3000),
('Academic Athlete', 'Study for 100 hours total', 'time', 'flame', 1000, 'study_minutes', 6000),

-- Streak achievements
('Getting Started', 'Maintain a 3-day study streak', 'streak', 'calendar', 100, 'streak_days', 3),
('Consistent Learner', 'Maintain a 7-day study streak', 'streak', 'target', 200, 'streak_days', 7),
('Streak Master', 'Maintain a 30-day study streak', 'streak', 'fire', 500, 'streak_days', 30),
('Unstoppable', 'Maintain a 100-day study streak', 'streak', 'award', 1000, 'streak_days', 100),

-- Subject achievements
('Math Enthusiast', 'Complete 20 math conversations', 'subject', 'calculator', 150, 'subject_conversations_math', 20),
('Science Explorer', 'Complete 20 science conversations', 'subject', 'microscope', 150, 'subject_conversations_science', 20),
('Language Lover', 'Complete 20 language conversations', 'subject', 'globe', 150, 'subject_conversations_language', 20),
('History Buff', 'Complete 20 history conversations', 'subject', 'scroll', 150, 'subject_conversations_history', 20),

-- XP achievements
('Rising Star', 'Earn 1,000 XP', 'xp', 'star', 100, 'total_xp', 1000),
('XP Collector', 'Earn 5,000 XP', 'xp', 'gem', 250, 'total_xp', 5000),
('XP Master', 'Earn 10,000 XP', 'xp', 'diamond', 500, 'total_xp', 10000),
('XP Legend', 'Earn 25,000 XP', 'xp', 'crown', 1000, 'total_xp', 25000),

-- Fun achievements
('Night Owl', 'Study after 10 PM', 'fun', 'moon', 75, 'late_night_study', 1),
('Early Bird', 'Study before 6 AM', 'fun', 'sunrise', 75, 'early_morning_study', 1),
('Weekend Warrior', 'Study on both Saturday and Sunday', 'fun', 'calendar-days', 100, 'weekend_study', 1),
('Speed Demon', 'Complete a 30+ minute session', 'fun', 'zap', 100, 'long_session', 30);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);