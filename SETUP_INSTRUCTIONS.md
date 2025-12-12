# 🚀 Instrucciones de Configuración Inicial

## Paso 1: Crear las Tablas en la Base de Datos

Ejecuta los siguientes scripts SQL en orden en tu consola de Supabase:

1. **`scripts/001_create_tables.sql`** - Crea las tablas de productos, categorías e imágenes
2. **`scripts/002_seed_categories.sql`** - Agrega categorías de ejemplo
3. **`scripts/003_create_registration_requests.sql`** - Crea tablas de solicitudes y usuarios admin
4. **`scripts/005_fix_rls_policies.sql`** - Configura las políticas de seguridad RLS

## Paso 2: Crear el Primer Administrador

Tienes dos opciones:

### Opción A: Usar la Página de Setup (Recomendado)
1. Ve a `http://localhost:3000/setup`
2. Completa el formulario con:
   - Email: `fheduardo136@gmail.com`
   - Contraseña: `12345678`
3. Haz clic en "Crear Administrador"
4. Se te redirigirá automáticamente al login

### Opción B: Crear Manualmente en Supabase
1. Ve a tu panel de Supabase
2. Crea un nuevo usuario en `Authentication > Users`:
   - Email: `fheduardo136@gmail.com`
   - Password: `12345678`
   - Marca "Auto confirm user"
3. Copia el ID del usuario (UUID)
4. Ejecuta el script `scripts/006_init_first_admin.sql` en la consola SQL de Supabase
   - Reemplaza `'YOUR_USER_ID_HERE'` con el UUID real si es necesario

## Paso 3: Acceder al Dashboard

1. Ve a `http://localhost:3000/auth/login`
2. Inicia sesión con:
   - Email: `fheduardo136@gmail.com`
   - Contraseña: `12345678`
3. Accederás al dashboard en `/admin`

## Paso 4: Gestionar Solicitudes de Registro

Otros usuarios pueden solicitar acceso en `/auth/signup`:
- Van al formulario de solicitud
- Envían su email y contraseña
- Los registros aparecen en `/admin/registrations`
- Tú los apruebas o rechazas desde el dashboard

## Solución de Problemas

### Error: "Multiple GoTrueClient instances detected"
- ✅ Solucionado en `lib/supabase/client.ts` con patrón singleton
- Solo necesitas actualizar el archivo con la nueva versión

### Error: "Unauthorized" en el dashboard
- Asegúrate de que:
  1. El usuario existe en `auth.users`
  2. El usuario está en la tabla `admin_users` con `is_admin = true`

### No puedo crear productos
- Verifica que tu usuario sea admin en la tabla `admin_users`
- Los permisos se controlan con Row Level Security (RLS)

## Estructura de Directorios

\`\`\`
/app
  /admin
    /page.tsx - Dashboard principal
    /products
      /new - Crear producto
      /[id] - Editar producto
    /registrations - Gestionar solicitudes
  /auth
    /login - Iniciar sesión
    /signup - Solicitar acceso
  /catalog - Catálogo público
  /product/[id] - Detalle del producto

/lib/supabase
  /client.ts - Cliente browser (singleton)
  /server.ts - Cliente server-side
  /proxy.ts - Middleware para auth

/scripts
  /001_create_tables.sql
  /002_seed_categories.sql
  /003_create_registration_requests.sql
  /005_fix_rls_policies.sql
  /006_init_first_admin.sql
\`\`\`

## Configuración de Entorno

Las siguientes variables están disponibles (agregadas automáticamente por Vercel cuando conectas Supabase):

- Claves públicas de Supabase (para el cliente)
- Claves secretas (para el servidor)

Verifica que todas las variables de entorno estén configuradas en tu proyecto de Vercel en la sección "Environment Variables".

## Características Implementadas

✅ Autenticación con Supabase
✅ Control de acceso basado en roles (admin vs usuario)
✅ Sistema de solicitudes de registro con aprobación
✅ Gestión de productos con categorías
✅ Carga de múltiples imágenes por producto
✅ Lógica automática de stock (agotado cuando stock=0)
✅ Catálogo público responsivo
✅ Detalle de producto con galerías
✅ Botones de compartir y WhatsApp
✅ Patrón singleton para evitar múltiples instancias de cliente

¡Todo listo para empezar! 🎉
