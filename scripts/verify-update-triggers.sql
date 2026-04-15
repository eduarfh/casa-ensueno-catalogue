-- Script para verificar y recrear los triggers de actualización de timestamp
-- Ejecutar en Supabase SQL Editor si hay problemas con las actualizaciones

-- 1. Verificar que la función set_timestamp existe
CREATE OR REPLACE FUNCTION set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recrear trigger para store_info
DROP TRIGGER IF EXISTS set_timestamp_trigger_store_info ON store_info;
CREATE TRIGGER set_timestamp_trigger_store_info
  BEFORE UPDATE ON store_info
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp();

-- 3. Recrear trigger para store_whatsapp_contacts
DROP TRIGGER IF EXISTS set_timestamp_trigger_store_whatsapp ON store_whatsapp_contacts;
CREATE TRIGGER set_timestamp_trigger_store_whatsapp
  BEFORE UPDATE ON store_whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp();

-- 4. Verificar que los triggers están activos
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('store_info', 'store_whatsapp_contacts')
ORDER BY event_object_table, trigger_name;

-- 5. Test de actualización manual (opcional)
-- UPDATE store_info SET label = label WHERE id = '837bcf3e-a25b-4d1a-a10a-da375760f353';
-- SELECT id, label, updated_at FROM store_info WHERE id = '837bcf3e-a25b-4d1a-a10a-da375760f353';
