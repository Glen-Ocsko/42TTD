/*
  # Add Activity Characteristics

  1. Changes
    - Add new columns for detailed activity characteristics
    - Add check constraints for valid values
    - Add enum type for indoor/outdoor and solo/social preferences
    
  2. Security
    - Maintain existing RLS policies
*/

-- Create enum types for structured data
DO $$ BEGIN
  CREATE TYPE location_preference AS ENUM ('indoor', 'outdoor', 'either');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE social_preference AS ENUM ('solo', 'social', 'either');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns with constraints
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS adventurousness integer CHECK (adventurousness >= 1 AND adventurousness <= 5),
ADD COLUMN IF NOT EXISTS creativity integer CHECK (creativity >= 1 AND creativity <= 5),
ADD COLUMN IF NOT EXISTS fitness integer CHECK (fitness >= 1 AND fitness <= 5),
ADD COLUMN IF NOT EXISTS learning integer CHECK (learning >= 1 AND learning <= 5),
ADD COLUMN IF NOT EXISTS solo_social social_preference DEFAULT 'either',
ADD COLUMN IF NOT EXISTS indoor_outdoor location_preference DEFAULT 'either',
ADD COLUMN IF NOT EXISTS planning_required integer CHECK (planning_required >= 1 AND planning_required <= 5),
ADD COLUMN IF NOT EXISTS risk_level integer CHECK (risk_level >= 1 AND risk_level <= 5);

-- Add check constraints if they don't exist
DO $$ BEGIN
  ALTER TABLE activities
    ADD CONSTRAINT activities_adventurousness_check 
    CHECK (adventurousness >= 1 AND adventurousness <= 5);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE activities
    ADD CONSTRAINT activities_creativity_check 
    CHECK (creativity >= 1 AND creativity <= 5);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE activities
    ADD CONSTRAINT activities_fitness_check 
    CHECK (fitness >= 1 AND fitness <= 5);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE activities
    ADD CONSTRAINT activities_learning_check 
    CHECK (learning >= 1 AND learning <= 5);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE activities
    ADD CONSTRAINT activities_planning_required_check 
    CHECK (planning_required >= 1 AND planning_required <= 5);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE activities
    ADD CONSTRAINT activities_risk_level_check 
    CHECK (risk_level >= 1 AND risk_level <= 5);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;