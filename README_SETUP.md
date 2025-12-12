# Catálogo de Productos HomeDecor - Guía de Configuración

## Estado Actual
✅ Página de inicio y navegación cargando correctamente
✅ Diseño moderno y alegre con colores vibrantes (Teal, Coral, Magenta)
✅ Componentes responsive y accesibles
⚠️ Supabase SSR tiene limitaciones en el ambiente v0

## Colores del Diseño
- **Primary (Teal)**: oklch(0.52 0.18 189.02) - Color principal
- **Secondary (Coral/Naranja)**: oklch(0.62 0.2 33.12) - Acentos
- **Accent (Magenta/Rosa)**: oklch(0.62 0.21 328.95) - Detalles especiales

## Para Hacer Funcionar Completamente

### 1. Instalar dependencias
\`\`\`bash
npm install
# o
yarn install
\`\`\`

### 2. Crear variables de entorno
Las variables ya están disponibles desde Vercel:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_BASE_URL
- BLOB_READ_WRITE_TOKEN
- POSTGRES_URL
- etc.

### 3. Ejecutar scripts SQL
Ir a Supabase → SQL Editor y ejecutar:
1. `scripts/001_create_tables.sql`
2. `scripts/002_seed_categories.sql`
3. `scripts/003_create_registration_requests.sql`
4. `scripts/004_add_admin_user.sql`
5. `scripts/005_fix_rls_policies.sql`
6. `scripts/006_init_first_admin.sql`

### 4. Crear usuario admin
- Email: fheduardo136@gmail.com
- Contraseña: 12345678

O usar la página de setup: `http://localhost:3000/setup`

## Rutas Disponibles
- `/` - Página de inicio
- `/catalog` - Catálogo de productos
- `/product/[id]` - Detalle del producto
- `/auth/login` - Login de admin
- `/auth/signup` - Registro de usuario
- `/admin` - Dashboard de administración
- `/admin/registrations` - Solicitudes de registro
- `/admin/products/new` - Crear producto
- `/admin/products/[id]` - Editar producto

## Problema Conocido: GoTrueClient Múltiples Instancias
La advertencia "Multiple GoTrueClient instances detected" es normal y no afecta el funcionamiento.
Se debe a la naturaleza de cómo se crean los clientes en Next.js.

## Solución Implementada
- Patrón singleton para clientes browser
- Fallback graceful si Supabase SSR no está disponible
- Middleware simplificado que no depende de Supabase para cada request

## Próximos Pasos
1. Descargar el código con el botón ZIP
2. Instalar con `shadcn-cli` si es nuevo proyecto
3. Configurar variables de entorno en Vercel
4. Ejecutar scripts SQL en Supabase
5. Hacer deploy a Vercel
