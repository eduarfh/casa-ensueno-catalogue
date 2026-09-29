-- Script para migrar productos existentes al sistema de monedas
-- Este script toma el precio actual de cada producto y lo asigna a la moneda CUP

-- IMPORTANTE: Ejecuta este script DESPUÉS de haber ejecutado add-currencies-schema.sql
-- y SOLO si tienes productos existentes que necesitan migración

-- Verifica cuántos productos no tienen monedas asignadas
SELECT 
  COUNT(DISTINCT p.id) as productos_sin_monedas
FROM products p
LEFT JOIN product_currencies pc ON p.id = pc.product_id
WHERE pc.id IS NULL;

-- Migración: Asignar el precio actual de cada producto a CUP
-- Solo para productos que no tienen monedas configuradas
INSERT INTO product_currencies (product_id, currency_id, price)
SELECT 
  p.id as product_id,
  c.id as currency_id,
  COALESCE(p.price, 0) as price
FROM products p
CROSS JOIN currencies c
LEFT JOIN product_currencies pc ON p.id = pc.product_id AND pc.currency_id = c.id
WHERE c.code = 'CUP' 
  AND c.is_active = true
  AND pc.id IS NULL  -- Solo productos que no tienen esta moneda
ON CONFLICT (product_id, currency_id) DO NOTHING;

-- Verificar la migración
SELECT 
  p.id,
  p.name,
  p.price as precio_original,
  c.code as moneda,
  pc.price as precio_en_moneda
FROM products p
JOIN product_currencies pc ON p.id = pc.product_id
JOIN currencies c ON pc.currency_id = c.id
ORDER BY p.name, c.display_order;

-- Estadísticas después de la migración
SELECT 
  'Total de productos' as descripcion,
  COUNT(*) as cantidad
FROM products
UNION ALL
SELECT 
  'Productos con monedas asignadas',
  COUNT(DISTINCT product_id)
FROM product_currencies
UNION ALL
SELECT 
  'Total de asignaciones producto-moneda',
  COUNT(*)
FROM product_currencies;

-- OPCIONAL: Si quieres asignar el precio a múltiples monedas por defecto
-- Descomenta y ajusta según tus necesidades

/*
-- Ejemplo: Agregar USD con un precio convertido (dividido por 25)
INSERT INTO product_currencies (product_id, currency_id, price)
SELECT 
  p.id as product_id,
  c.id as currency_id,
  ROUND(COALESCE(p.price, 0) / 25, 2) as price  -- Ajusta la tasa de conversión
FROM products p
CROSS JOIN currencies c
LEFT JOIN product_currencies pc ON p.id = pc.product_id AND pc.currency_id = c.id
WHERE c.code = 'USD' 
  AND c.is_active = true
  AND pc.id IS NULL
ON CONFLICT (product_id, currency_id) DO NOTHING;
*/

/*
-- Ejemplo: Agregar EUR con un precio convertido (dividido por 30)
INSERT INTO product_currencies (product_id, currency_id, price)
SELECT 
  p.id as product_id,
  c.id as currency_id,
  ROUND(COALESCE(p.price, 0) / 30, 2) as price  -- Ajusta la tasa de conversión
FROM products p
CROSS JOIN currencies c
LEFT JOIN product_currencies pc ON p.id = pc.product_id AND pc.currency_id = c.id
WHERE c.code = 'EUR' 
  AND c.is_active = true
  AND pc.id IS NULL
ON CONFLICT (product_id, currency_id) DO NOTHING;
*/

-- ROLLBACK (deshacer cambios) - DESCOMENTA SOLO SI NECESITAS REVERTIR
/*
DELETE FROM product_currencies;
*/
