-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Create BIR Deadlines table
CREATE TABLE IF NOT EXISTS bir_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  form_type VARCHAR(50) NOT NULL,
  form_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  is_filed BOOLEAN DEFAULT FALSE,
  filed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT check_filed_date CHECK (
    (is_filed = FALSE AND filed_date IS NULL) OR
    (is_filed = TRUE AND filed_date IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bir_deadlines_user_id ON bir_deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_bir_deadlines_user_due_date ON bir_deadlines(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_bir_deadlines_due_date ON bir_deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_bir_deadlines_is_filed ON bir_deadlines(user_id, is_filed);

-- Enable Row Level Security
ALTER TABLE bir_deadlines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own deadlines" ON bir_deadlines;
DROP POLICY IF EXISTS "Users can insert their own deadlines" ON bir_deadlines;
DROP POLICY IF EXISTS "Users can update their own deadlines" ON bir_deadlines;
DROP POLICY IF EXISTS "Users can delete their own deadlines" ON bir_deadlines;

-- RLS Policy: Users can only read their own deadlines
CREATE POLICY "Users can view their own deadlines" ON bir_deadlines
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert deadlines for themselves
CREATE POLICY "Users can insert their own deadlines" ON bir_deadlines
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own deadlines
CREATE POLICY "Users can update their own deadlines" ON bir_deadlines
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own deadlines
CREATE POLICY "Users can delete their own deadlines" ON bir_deadlines
  FOR DELETE
  USING (auth.uid() = user_id);

-- Automatically update updated_at timestamp
CREATE TRIGGER update_bir_deadlines_updated_at BEFORE UPDATE ON bir_deadlines
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON bir_deadlines TO authenticated;

-- Create a view for upcoming deadlines (unfiled deadlines only)
CREATE OR REPLACE VIEW upcoming_bir_deadlines AS
SELECT
  id,
  user_id,
  form_type,
  form_name,
  due_date,
  description,
  is_filed,
  filed_date,
  CURRENT_DATE,
  (due_date - CURRENT_DATE) AS days_remaining,
  CASE
    WHEN (due_date - CURRENT_DATE) <= 3 THEN 'critical'
    WHEN (due_date - CURRENT_DATE) <= 7 THEN 'warning'
    ELSE 'normal'
  END AS priority_level,
  created_at,
  updated_at
FROM bir_deadlines
WHERE is_filed = FALSE
  AND due_date >= CURRENT_DATE
ORDER BY due_date ASC;

-- Grant permissions to authenticated users for the view
GRANT SELECT ON upcoming_bir_deadlines TO authenticated;
