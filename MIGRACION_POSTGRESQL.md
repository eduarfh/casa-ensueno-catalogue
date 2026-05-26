# Migración de Supabase a PostgreSQL Directo (Railway)

## Estado de la Migración

### ✅ Completado

1. **Variables de entorno**
   - `.env.example` - Actualizado con DATABASE_URL
   - `.env.local` - Configurado con tu conexión de Railway

2. **Librerías base**
   - `lib/db.ts` - Cliente PostgreSQL con pool de conexiones
   - `lib/db-helpers.ts` - Helpers para queries (insert, update, delete, query builder)
   - `lib/admin-auth.ts` - Migrado a PostgreSQL directo

3. **APIs migradas**
   - `app/api/products/route.ts` - GET y POST migrados

### 🔄 Pendiente de Migración

Los siguientes archivos aún usan Supabase y necesitan ser migrados:

#### APIs de Productos
- `app/api/products/[id]/route.ts` - GET, PUT, DELETE de producto individual
- `app/api/products/search/route.ts` - Búsqueda de productos

#### APIs de Admin
- `app/api/admin/check/route.ts`
- `app/api/admin/create-initial/route.ts`
- `app/api/admin/save-store/route.tsx`
- `app/api/admin/store-whatsapp/route.ts`
- `app/api/admin/registrations/route.ts`
- `app/api/admin/registrations/approve/route.ts`
- `app/api/admin/registrations/reject/route.ts`
- `app/api/admin/approve/route.ts`

#### APIs de Auth
- `app/api/auth/create-admin/route.ts`
- `app/api/auth/request-registration/route.ts`
- `app/api/auth/set-session/route.ts`
- `app/api/auth/clear-session/route.ts`

#### APIs de Store
- `app/api/store-info/route.ts`
- `app/api/store-whatsapp/route.ts`

#### APIs de Storage
- `app/api/storage/usage/route.ts`
- `app/api/upload/route.ts`

#### Páginas
- `app/catalog/page.tsx`
- `app/product/[id]/page.tsx`
- `app/admin/page.tsx`
- `app/admin/products/[id]/page.tsx`
- `app/admin/products/new/page.tsx`
- `app/admin/registrations/page.tsx`
- `app/auth/callback/route.ts`
- `app/auth/logout/route.ts`

#### Componentes
- `app/admin/registrations/page.tsx` - Usa createClient del lado del cliente

### 📦 Dependencias

Puedes remover estas dependencias de Supabase cuando completes la migración:
```json
"@supabase/ssr": "0.8.0",
"@supabase/supabase-js": "2.87.1",
```

Ya tienes instalado:
```json
"pg": "^8.21.0"
```

### 🔧 Patrón de Migración

#### Antes (Supabase):
\`\`\`typescript
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();
const { data, error } = await supabase
  .from("products")
  .select("*")
  .eq("id", productId)
  .single();
\`\`\`

#### Después (PostgreSQL):
\`\`\`typescript
import { query } from "@/lib/db";

const result = await query(
  'SELECT * FROM products WHERE id = $1',
  [productId]
);
const data = result.rows[0];
\`\`\`

### 📝 Notas Importantes

1. **Almacenamiento de Imágenes**: Aún no has decidido qué usar (AWS S3, Cloudinary, etc.). Las variables están comentadas en `.env.local`.

2. **Supabase Storage**: Si estabas usando Supabase Storage para imágenes, necesitarás migrar a otra solución.

3. **RLS (Row Level Security)**: PostgreSQL directo no tiene RLS automático como Supabase. Deberás manejar la autorización en tu código.

4. **Realtime**: Si usabas Supabase Realtime, necesitarás otra solución (WebSockets, Pusher, etc.).

### 🚀 Próximos Pasos

1. Decide qué solución de almacenamiento usar para imágenes
2. Migra los archivos API restantes siguiendo el patrón mostrado
3. Actualiza las páginas que consultan datos
4. Prueba todas las funcionalidades
5. Remueve las dependencias de Supabase
6. Elimina la carpeta `lib/supabase/`

### 🔍 Comando para Encontrar Archivos Pendientes

\`\`\`bash
# Buscar todos los archivos que aún importan de Supabase
grep -r "from '@/lib/supabase" app/ lib/ components/ --include="*.ts" --include="*.tsx"
\`\`\`

## Configuración de Railway

Tu `DATABASE_URL` actual:
\`\`\`
postgresql://postgres:XLYKHDiChVrxhxzeUecpVUiIRWwSVSvh@zephyr.proxy.rlwy.net:20786/railway
\`\`\`

Esta URL ya está configurada en `.env.local` y el pool de conexiones en `lib/db.ts` la usa automáticamente.
