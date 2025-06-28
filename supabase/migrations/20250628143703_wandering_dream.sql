/*
  # Create personalized learning system tables

  1. New Tables
    - `user_learning_preferences` - Stores user learning preferences
    - `learning_paths` - Stores personalized learning paths
    - `learning_path_topics` - Stores topics within learning paths
    - `learning_resources` - Stores resources for topics
    - `assessments` - Stores assessments for topics
    - `assessment_questions` - Stores questions for assessments
    - `assessment_results` - Stores user assessment results
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create user_learning_preferences table
CREATE TABLE IF NOT EXISTS user_learning_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  learning_style text NOT NULL DEFAULT 'visual',
  preferred_difficulty text NOT NULL DEFAULT 'High School',
  preferred_pace text NOT NULL DEFAULT 'moderate',
  preferred_time_of_day text NOT NULL DEFAULT 'afternoon',
  preferred_session_duration integer NOT NULL DEFAULT 30,
  preferred_subjects text[] DEFAULT '{}',
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  goals text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  subject text NOT NULL,
  difficulty_level text NOT NULL,
  completion_rate integer NOT NULL DEFAULT 0,
  estimated_time_to_complete integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_path_topics table
CREATE TABLE IF NOT EXISTS learning_path_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  order_index integer NOT NULL,
  estimated_time_to_complete integer NOT NULL DEFAULT 0,
  prerequisites text[] DEFAULT '{}',
  mastery_score integer NOT NULL DEFAULT 0,
  last_studied timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_resources table
CREATE TABLE IF NOT EXISTS learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES learning_path_topics(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  url text,
  content text,
  estimated_time_to_complete integer NOT NULL DEFAULT 0,
  difficulty_level text NOT NULL,
  learning_style text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES learning_path_topics(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  passing_score integer NOT NULL DEFAULT 70,
  time_limit integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assessment_questions table
CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  prompt text NOT NULL,
  options text[],
  correct_answer text,
  points integer NOT NULL DEFAULT 1,
  difficulty text NOT NULL DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assessment_results table
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL,
  time_spent integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_learning_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- Create policies for user_learning_preferences
CREATE POLICY "Users can view their own learning preferences"
  ON user_learning_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning preferences"
  ON user_learning_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning preferences"
  ON user_learning_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for learning_paths
CREATE POLICY "Users can view their own learning paths"
  ON learning_paths
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning paths"
  ON learning_paths
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning paths"
  ON learning_paths
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning paths"
  ON learning_paths
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for learning_path_topics
CREATE POLICY "Users can view topics in their learning paths"
  ON learning_path_topics
  FOR SELECT
  TO authenticated
  USING (
    learning_path_id IN (
      SELECT id FROM learning_paths WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update topics in their learning paths"
  ON learning_path_topics
  FOR UPDATE
  TO authenticated
  USING (
    learning_path_id IN (
      SELECT id FROM learning_paths WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert topics in their learning paths"
  ON learning_path_topics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    learning_path_id IN (
      SELECT id FROM learning_paths WHERE user_id = auth.uid()
    )
  );

-- Create policies for learning_resources
CREATE POLICY "Users can view resources for their topics"
  ON learning_resources
  FOR SELECT
  TO authenticated
  USING (
    topic_id IN (
      SELECT id FROM learning_path_topics WHERE learning_path_id IN (
        SELECT id FROM learning_paths WHERE user_id = auth.uid()
      )
    )
  );

-- Create policies for assessments
CREATE POLICY "Users can view assessments for their topics"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (
    topic_id IN (
      SELECT id FROM learning_path_topics WHERE learning_path_id IN (
        SELECT id FROM learning_paths WHERE user_id = auth.uid()
      )
    )
  );

-- Create policies for assessment_questions
CREATE POLICY "Users can view questions for their assessments"
  ON assessment_questions
  FOR SELECT
  TO authenticated
  USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE topic_id IN (
        SELECT id FROM learning_path_topics WHERE learning_path_id IN (
          SELECT id FROM learning_paths WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Create policies for assessment_results
CREATE POLICY "Users can view their own assessment results"
  ON assessment_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessment results"
  ON assessment_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_topics_path_id ON learning_path_topics(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_topic_id ON learning_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_assessments_topic_id ON assessments(topic_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_learning_preferences_updated_at
  BEFORE UPDATE ON user_learning_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_path_topics_updated_at
  BEFORE UPDATE ON learning_path_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_resources_updated_at
  BEFORE UPDATE ON learning_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_questions_updated_at
  BEFORE UPDATE ON assessment_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();