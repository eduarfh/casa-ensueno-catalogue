-- Insert sample categories
INSERT INTO categories (name, description) VALUES
  ('Iluminación', 'Lámparas, focos y sistemas de iluminación'),
  ('Textiles', 'Cortinas, alfombras, cojines y tapestería'),
  ('Muebles', 'Mesas, sillas, estanterías y más'),
  ('Decoración', 'Cuadros, espeljos, plantas y accesorios'),
  ('Cocina', 'Utensilios de cocina y artículos de comedor')
ON CONFLICT (name) DO NOTHING;
