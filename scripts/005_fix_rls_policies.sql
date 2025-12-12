-- Drop existing policies if they conflict with the actual table structure
DROP POLICY IF EXISTS "admin_view_registration_requests" ON registration_requests;
DROP POLICY IF EXISTS "admin_update_registration_requests" ON registration_requests;
DROP POLICY IF EXISTS "admin_view_admin_users" ON admin_users;

-- Create updated RLS policies for registration_requests
-- Allow all authenticated users to insert their own registration request
CREATE POLICY "users_insert_own_registration"
  ON registration_requests FOR INSERT
  WITH CHECK (true);

-- Allow only admins to view registration requests
CREATE POLICY "admin_view_registration_requests"
  ON registration_requests FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_admin = true
    )
  );

-- Allow only admins to update registration requests
CREATE POLICY "admin_update_registration_requests"
  ON registration_requests FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_admin = true
    )
  );

-- RLS policies for admin_users
-- Allow users to view their own admin status
CREATE POLICY "users_view_own_admin_status"
  ON admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to view all admin users
CREATE POLICY "admin_view_all_admin_users"
  ON admin_users FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_admin = true
    )
  );

-- Update admin_users policies
DROP POLICY IF EXISTS "admin_view_admin_users" ON admin_users;

-- Allow products and images to be viewed by everyone
CREATE POLICY "public_read_products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "public_read_product_images"
  ON product_images FOR SELECT
  USING (true);

-- Allow admin to manage products
CREATE POLICY "admin_manage_products"
  ON products FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_admin = true
    )
  );

CREATE POLICY "admin_manage_product_images"
  ON product_images FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM product_images.product_id WHERE product_id IN (
        SELECT id FROM products
      )
    ) OR auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_admin = true
    )
  );
