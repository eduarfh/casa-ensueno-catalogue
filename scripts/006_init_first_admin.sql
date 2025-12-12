-- This script initializes the first admin user
-- IMPORTANT: Before running this script:
-- 1. Create an auth user manually in Supabase dashboard with:
--    Email: fheduardo136@gmail.com
--    Password: 12345678
-- 2. Copy the user ID (UUID) from the auth.users table
-- 3. Replace 'YOUR_USER_ID_HERE' below with the actual UUID

-- Option 1: If you know the exact user ID, uncomment and use this:
-- INSERT INTO admin_users (user_id, is_admin) 
-- VALUES ('YOUR_USER_ID_HERE', true)
-- ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

-- Option 2: If the user with this email exists, this will work:
INSERT INTO admin_users (user_id, is_admin) 
SELECT id, true
FROM auth.users
WHERE email = 'fheduardo136@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET is_admin = true;
