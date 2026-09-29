-- Script para agregar el sistema de monedas
-- Ejecutar este script en la base de datos después del railway_migration_schema.sql

-- Tabla de monedas
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  code VARCHAR(3) NOT NULL UNIQUE, -- CUP, USD, EUR, etc.
  symbol VARCHAR(10) NOT NULL, -- $, €, £, etc.
  name TEXT NOT NULL, -- Peso Cubano, Dólar estadounidense, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NULL DEFAULT 0, -- para ordenar en el frontend
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT currencies_pkey PRIMARY KEY (id)
);

-- Índice para búsqueda rápida por código
CREATE INDEX IF NOT EXISTS idx_currencies_code ON public.currencies USING btree (code);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON public.currencies USING btree (is_active);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS set_timestamp_trigger_currencies ON public.currencies;
CREATE TRIGGER set_timestamp_trigger_currencies
BEFORE UPDATE ON public.currencies
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Tabla de relación producto-moneda (muchos a muchos)
CREATE TABLE IF NOT EXISTS public.product_currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  currency_id UUID NOT NULL,
  price NUMERIC(10, 2) NOT NULL, -- precio en esta moneda específica
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT product_currencies_pkey PRIMARY KEY (id),
  CONSTRAINT product_currencies_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE CASCADE,
  CONSTRAINT product_currencies_currency_id_fkey 
    FOREIGN KEY (currency_id) REFERENCES public.currencies (id) ON DELETE CASCADE,
  -- Un producto no puede tener la misma moneda dos veces
  CONSTRAINT product_currencies_unique UNIQUE (product_id, currency_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_product_currencies_product 
  ON public.product_currencies USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_product_currencies_currency 
  ON public.product_currencies USING btree (currency_id);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS set_timestamp_trigger_product_currencies ON public.product_currencies;
CREATE TRIGGER set_timestamp_trigger_product_currencies
BEFORE UPDATE ON public.product_currencies
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Insertar monedas por defecto
INSERT INTO public.currencies (code, symbol, name, is_active, display_order) VALUES
  ('CUP', '$', 'Peso Cubano', true, 1),
  ('USD', '$', 'Dólar Estadounidense', true, 2),
  ('EUR', '€', 'Euro', true, 3),
  ('MLC', '$', 'MLC', true, 4)
ON CONFLICT (code) DO NOTHING;

-- NOTA IMPORTANTE:
-- El campo 'price' en la tabla 'products' se mantiene por compatibilidad
-- pero ahora los precios reales vendrán de 'product_currencies'.
-- Puedes mantener 'price' como precio por defecto o de referencia.

COMMENT ON TABLE public.currencies IS 'Catálogo de monedas disponibles';
COMMENT ON TABLE public.product_currencies IS 'Relación muchos a muchos entre productos y monedas con sus precios específicos';
COMMENT ON COLUMN public.product_currencies.price IS 'Precio del producto en esta moneda específica';
