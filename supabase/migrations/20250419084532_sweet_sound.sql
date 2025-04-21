/*
  # Add Contact Messages Table

  1. New Table
    - `contact_messages`
      - For storing contact form submissions
      - Links to users table if message is from logged-in user
      - Includes basic contact information and message content

  2. Security
    - Enable RLS
    - Allow public insert access (anyone can submit a message)
    - Only admins can view messages
*/

CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a message
CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view messages
CREATE POLICY "Only admins can view contact messages"
  ON contact_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );