-- Enable public read access to products and product_images tables
-- This allows the public catalog to display products without authentication

-- Enable RLS on products table (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product_images table (if not already enabled)
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access to products" ON products;
DROP POLICY IF EXISTS "Public read access to product_images" ON product_images;

-- Create policy to allow public read access to products
CREATE POLICY "Public read access to products"
ON products
FOR SELECT
TO public
USING (true);

-- Create policy to allow public read access to product_images
CREATE POLICY "Public read access to product_images"
ON product_images
FOR SELECT
TO public
USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('products', 'product_images')
ORDER BY tablename, policyname;
