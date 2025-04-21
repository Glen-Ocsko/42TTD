/*
  # Add Supplier API Tokens

  1. New Tables
    - `supplier_api_tokens`
      - Stores API tokens for suppliers
      - Includes token name, hashed token, and expiry
      - Tracks last used timestamp

  2. Security
    - Enable RLS
    - Add policies for supplier access
    - Store tokens securely with hashing
*/

-- Create supplier_api_tokens table
CREATE TABLE IF NOT EXISTS supplier_api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  token text NOT NULL,
  token_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  last_used_at timestamptz,
  UNIQUE(token_hash)
);

-- Enable RLS
ALTER TABLE supplier_api_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Suppliers can view their own tokens"
  ON supplier_api_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_api_tokens.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can create their own tokens"
  ON supplier_api_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_api_tokens.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can delete their own tokens"
  ON supplier_api_tokens
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_api_tokens.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Create function to verify API token
CREATE OR REPLACE FUNCTION verify_api_token(token_to_verify text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_hash text;
  supplier_id uuid;
BEGIN
  -- Hash the token
  token_hash := encode(digest(token_to_verify, 'sha256'), 'hex');
  
  -- Find the token in the database
  SELECT sat.supplier_id INTO supplier_id
  FROM supplier_api_tokens sat
  WHERE sat.token_hash = token_hash
  AND (sat.expires_at IS NULL OR sat.expires_at > now());
  
  -- If token is valid, update last_used_at
  IF supplier_id IS NOT NULL THEN
    UPDATE supplier_api_tokens
    SET last_used_at = now()
    WHERE token_hash = token_hash;
  END IF;
  
  RETURN supplier_id;
END;
$$;