-- Create first admin user
-- IMPORTANT: Replace 'your-email@example.com' and 'your-password' with your actual credentials

-- Step 1: Create the auth user (if not already created)
-- You can do this through Supabase Dashboard > Authentication > Users > Add User
-- OR use this SQL (requires service_role key):

-- Step 2: After creating the user in Supabase Auth, get their user_id
-- Then insert into admin_users table
-- Replace 'USER_ID_HERE' with the actual UUID from auth.users

INSERT INTO public.admin_users (user_id, is_admin)
VALUES (
  -- Get the user_id from the email
  (SELECT id FROM auth.users WHERE email = 'eduardo@example.com' LIMIT 1),
  true
)
ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

-- Verify the admin was created
SELECT 
  au.id,
  au.user_id,
  au.is_admin,
  u.email,
  au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE au.is_admin = true;
