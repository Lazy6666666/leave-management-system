-- MIGRATION: 20251008041511_enable_realtime_on_profiles.sql

-- Enable real-time on the profiles table
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- Create a publication for the profiles table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE profiles;
  ELSE
    -- Add profiles to existing publication if not already included
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Publication already exists and profiles table is already included
    NULL;
  WHEN duplicate_table THEN
    -- Table already in publication
    NULL;
END $$;
