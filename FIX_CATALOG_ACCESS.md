# Solución: Catálogo no muestra productos

## Problema
El catálogo público no muestra productos aunque el panel de administración sí los muestra.

## Causa
Las políticas RLS (Row Level Security) de Supabase están bloqueando el acceso público a las tablas `products` y `product_images`.

- Panel de administración funciona: usa `SUPABASE_SERVICE_ROLE_KEY` que bypasea RLS
- Catálogo público falla: usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` que respeta RLS

## Solución

### Opción 1: Ejecutar script SQL en Supabase (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo `scripts/enable-public-read-access.sql`
5. Ejecuta el script (botón "Run" o Ctrl+Enter)

El script:
- Habilita RLS en las tablas `products` y `product_images`
- Crea políticas que permiten lectura pública (SELECT) a todos
- Mantiene la seguridad: solo lectura pública, escritura requiere autenticación

### Opción 2: Configurar políticas manualmente en Supabase

1. Ve a **Authentication > Policies** en Supabase Dashboard
2. Para la tabla `products`:
   - Click en "New Policy"
   - Selecciona "Enable read access for all users"
   - Nombre: "Public read access to products"
   - Policy command: SELECT
   - Target roles: public
   - USING expression: `true`
   - Click "Review" y luego "Save policy"

3. Repite para la tabla `product_images`:
   - Nombre: "Public read access to product_images"
   - Policy command: SELECT
   - Target roles: public
   - USING expression: `true`

### Verificar que funciona

Después de aplicar las políticas:

1. Recarga la página del catálogo (`/catalog`)
2. Deberías ver todos los productos
3. Verifica los logs en la terminal del servidor:
   - `[catalog] dbProducts: X` (debe mostrar el número de productos)
   - `[catalog] Processing X products`
   - `[CatalogClient] Received serverProducts: X items`

## Seguridad

Las políticas creadas son seguras porque:
- Solo permiten **lectura** (SELECT) pública
- Las operaciones de escritura (INSERT, UPDATE, DELETE) siguen requiriendo autenticación
- El panel de administración usa credenciales de admin para modificar productos

## Notas adicionales

Si en el futuro quieres que solo ciertos productos sean públicos (por ejemplo, solo los que tienen `available: true`), puedes modificar la política:

```sql
-- Solo mostrar productos disponibles
CREATE POLICY "Public read access to available products"
ON products
FOR SELECT
TO public
USING (available = true);
```
