-- Script para habilitar RLS y crear políticas para store_info y store_whatsapp_contacts
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. HABILITAR RLS EN LAS TABLAS
-- ============================================

-- Habilitar RLS en store_info
ALTER TABLE store_info ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en store_whatsapp_contacts
ALTER TABLE store_whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLÍTICAS PARA store_info
-- ============================================

-- Permitir lectura pública (SELECT) para todos
DROP POLICY IF EXISTS "Allow public read access to store_info" ON store_info;
CREATE POLICY "Allow public read access to store_info"
  ON store_info
  FOR SELECT
  TO public
  USING (true);

-- Permitir INSERT solo con service_role (desde API admin)
DROP POLICY IF EXISTS "Allow service_role insert on store_info" ON store_info;
CREATE POLICY "Allow service_role insert on store_info"
  ON store_info
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Permitir UPDATE solo con service_role (desde API admin)
DROP POLICY IF EXISTS "Allow service_role update on store_info" ON store_info;
CREATE POLICY "Allow service_role update on store_info"
  ON store_info
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Permitir DELETE solo con service_role (desde API admin)
DROP POLICY IF EXISTS "Allow service_role delete on store_info" ON store_info;
CREATE POLICY "Allow service_role delete on store_info"
  ON store_info
  FOR DELETE
  TO service_role
  USING (true);

-- ============================================
-- 3. POLÍTICAS PARA store_whatsapp_contacts
-- ============================================

-- Permitir lectura pública (SELECT) para todos
DROP POLICY IF EXISTS "Allow public read access to store_whatsapp_contacts" ON store_whatsapp_contacts;
CREATE POLICY "Allow public read access to store_whatsapp_contacts"
  ON store_whatsapp_contacts
  FOR SELECT
  TO public
  USING (true);

-- Permitir INSERT solo con service_role (desde API admin)
DROP POLICY IF EXISTS "Allow service_role insert on store_whatsapp_contacts" ON store_whatsapp_contacts;
CREATE POLICY "Allow service_role insert on store_whatsapp_contacts"
  ON store_whatsapp_contacts
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Permitir UPDATE solo con service_role (desde API admin)
DROP POLICY IF EXISTS "Allow service_role update on store_whatsapp_contacts" ON store_whatsapp_contacts;
CREATE POLICY "Allow service_role update on store_whatsapp_contacts"
  ON store_whatsapp_contacts
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Permitir DELETE solo con service_role (desde API admin)
DROP POLICY IF EXISTS "Allow service_role delete on store_whatsapp_contacts" ON store_whatsapp_contacts;
CREATE POLICY "Allow service_role delete on store_whatsapp_contacts"
  ON store_whatsapp_contacts
  FOR DELETE
  TO service_role
  USING (true);

-- ============================================
-- 4. VERIFICAR POLÍTICAS CREADAS
-- ============================================

-- Ver todas las políticas de store_info
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('store_info', 'store_whatsapp_contacts')
ORDER BY tablename, policyname;

-- ============================================
-- 5. TEST DE LECTURA (Opcional)
-- ============================================

-- Verificar que se puede leer store_info
-- SELECT * FROM store_info;

-- Verificar que se puede leer store_whatsapp_contacts
-- SELECT * FROM store_whatsapp_contacts;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Las políticas permiten:
--    - Lectura pública (cualquiera puede ver la info de la tienda)
--    - Escritura solo desde el backend con service_role (APIs admin)
--
-- 2. El service_role bypasea RLS por defecto, pero estas políticas
--    son explícitas para mayor claridad
--
-- 3. Si necesitas restringir la lectura en el futuro, puedes modificar
--    la política de SELECT para agregar condiciones
