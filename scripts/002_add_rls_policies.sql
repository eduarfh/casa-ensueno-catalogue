-- Add RLS Policies for INSERT, UPDATE, DELETE operations for authenticated users

-- Categories: Allow authenticated users to manage categories
CREATE POLICY "categories_insert_authenticated"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "categories_update_authenticated"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "categories_delete_authenticated"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Products: Allow authenticated users to manage products
CREATE POLICY "products_insert_authenticated"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "products_update_authenticated"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "products_delete_authenticated"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Product Images: Allow authenticated users to manage product images
CREATE POLICY "product_images_insert_authenticated"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "product_images_update_authenticated"
  ON product_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_images_delete_authenticated"
  ON product_images FOR DELETE
  TO authenticated
  USING (true);
