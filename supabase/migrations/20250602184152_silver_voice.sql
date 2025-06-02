-- Add summary column to conversations table
ALTER TABLE conversations
ADD COLUMN summary text;

-- Create conversation_summaries view
CREATE VIEW conversation_summaries AS
SELECT 
  c.id,
  c.user_id,
  c.timestamp,
  c.summary,
  c.user_message,
  c.ai_response
FROM conversations c
WHERE c.summary IS NOT NULL;

-- Enable RLS for the view
ALTER VIEW conversation_summaries OWNER TO postgres;

GRANT SELECT ON conversation_summaries TO authenticated;

CREATE POLICY "Users can view their own conversation summaries"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);