-- Create registration requests table for admin approval
CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT
);

-- Create index for status queries
CREATE INDEX idx_registration_requests_status ON registration_requests(status);

-- Enable RLS
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can view all registration requests
CREATE POLICY "admin_view_registration_requests"
  ON registration_requests FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_admin = true
    )
  );

-- Only admins can update registration requests
CREATE POLICY "admin_update_registration_requests"
  ON registration_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_admin = true
    )
  );

-- Create admin_users table to track admin permissions
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users
CREATE POLICY "admin_view_admin_users"
  ON admin_users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_admin = true
    ) OR auth.uid() = user_id
  );
