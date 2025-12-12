-- Add initial admin user (fheduardo136@gmail.com)
-- NOTE: This script requires that you've already created the auth user manually or via a separate auth API call
-- For now, you can manually:
-- 1. Go to Supabase dashboard
-- 2. Create user fheduardo136@gmail.com with password 12345678
-- 3. Get the user ID and update this script, then run it:

-- Get the user ID from Supabase auth, then run:
-- First, let's check if the user exists and add them to admin_users
-- This assumes the user fheduardo136@gmail.com already exists in auth.users

-- Insert admin user if they don't exist
INSERT INTO admin_users (user_id, is_admin)
SELECT id, true
FROM auth.users
WHERE email = 'fheduardo136@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM admin_users WHERE user_id = auth.users.id
);
