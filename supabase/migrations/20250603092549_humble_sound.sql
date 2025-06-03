/*
  # Create conversations table

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `user_message` (text)
      - `ai_response` (text)
      - `duration` (integer)
      - `summary` (text)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on conversations table
    - Add policies for authenticated users to:
      - Insert their own conversations
      - Read their own conversations
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_message text NOT NULL,
  ai_response text NOT NULL,
  duration integer NOT NULL,
  summary text,
  timestamp timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own conversations
CREATE POLICY "Users can insert their own conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to read their own conversations
CREATE POLICY "Users can read their own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index on user_id and timestamp for faster queries
CREATE INDEX conversations_user_id_timestamp_idx ON conversations(user_id, timestamp DESC);

-- Create index on user_id for foreign key lookups
CREATE INDEX conversations_user_id_idx ON conversations(user_id);