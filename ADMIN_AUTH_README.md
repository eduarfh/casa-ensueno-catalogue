# Sistema de Autenticación de Administración

Este proyecto utiliza un sistema de autenticación simple e independiente para el panel de administración, sin depender de la base de datos.

## Características

- Credenciales únicas almacenadas localmente en desarrollo
- Variables de entorno para producción (persistente)
- No requiere base de datos para la autenticación
- Las credenciales se pueden cambiar desde el panel de administración
- Sistema de sesión basado en cookies HTTP-only

## Credenciales por Defecto

Al iniciar la aplicación por primera vez, se crean automáticamente las siguientes credenciales:

- **Usuario:** `admin`
- **Contraseña:** `admin123`

## Flujo de Trabajo

### Desarrollo Local

1. Las credenciales se almacenan en `.admin-credentials.json`
2. El archivo se crea automáticamente al ejecutar `npm install`
3. Puedes cambiar las credenciales desde el panel de administración
4. Los cambios se guardan en el archivo local

### Producción (Deploy)

1. **Primera vez:** Usa las credenciales por defecto para acceder
2. **Cambiar credenciales:** 
   - Ve a la página de configuración (icono 🔑)
   - Ingresa tu contraseña actual
   - Define nuevas credenciales
   - El sistema te mostrará un modal con las variables de entorno
3. **Configurar en tu plataforma:**
   - Copia las variables mostradas
   - Agrégalas en tu plataforma de hosting (Vercel, Railway, etc.)
   - Ejemplo en Vercel: Settings → Environment Variables
   - Variables necesarias:
     ```
     ADMIN_USERNAME=tu_usuario
     ADMIN_PASSWORD_HASH=tu_hash_generado
     ```
4. **Redeploy:** Después de agregar las variables, haz un nuevo deploy

## Cambiar Credenciales

1. Inicia sesión en el panel de administración con las credenciales actuales
2. Haz clic en el icono de llave (🔑) en el header
3. Ingresa tu contraseña actual
4. Define el nuevo usuario y contraseña
5. Confirma la nueva contraseña
6. Haz clic en "Actualizar Credenciales"

### En Desarrollo
- Los cambios se guardan automáticamente en `.admin-credentials.json`

### En Producción
- El sistema te mostrará un modal con las variables de entorno
- Copia las variables y configúralas en tu plataforma de hosting
- Haz un redeploy para aplicar los cambios

## Archivos Importantes

- `lib/admin-auth.ts` - Lógica de autenticación y gestión de credenciales
- `.admin-credentials.json` - Archivo donde se almacenan las credenciales en desarrollo (no se sube a git)
- `app/api/auth/admin-login/route.ts` - Endpoint de inicio de sesión
- `app/api/auth/admin-logout/route.ts` - Endpoint de cierre de sesión
- `app/api/auth/admin-check/route.ts` - Endpoint de verificación de sesión
- `app/api/auth/admin-credentials/route.ts` - Endpoint para obtener y actualizar credenciales
- `app/admin/settings/page.tsx` - Página de configuración de credenciales

## Seguridad

- Las contraseñas se almacenan hasheadas con SHA-256
- Las sesiones utilizan cookies HTTP-only para prevenir ataques XSS
- El archivo de credenciales está excluido del control de versiones
- Las contraseñas deben tener al menos 6 caracteres
- Los usuarios deben tener al menos 3 caracteres
- En producción, las credenciales se almacenan en variables de entorno (más seguro)

## Prioridad de Credenciales

El sistema busca las credenciales en el siguiente orden:

1. **Variables de entorno** (producción): `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH`
2. **Archivo local** (desarrollo): `.admin-credentials.json`
3. **Credenciales por defecto**: admin / admin123

## Recuperación de Contraseña

### En Desarrollo
Si olvidas tu contraseña:
1. Elimina el archivo `.admin-credentials.json`
2. Ejecuta `npm run init-admin`
3. Se crearán las credenciales por defecto nuevamente

### En Producción
Si olvidas tu contraseña:
1. Elimina las variables de entorno `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH`
2. Haz un redeploy
3. Usa las credenciales por defecto (admin / admin123)
4. Cambia las credenciales inmediatamente

## Configuración en Plataformas de Hosting

### Vercel
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las variables:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`
4. Redeploy el proyecto

### Railway
1. Ve a tu proyecto en Railway
2. Variables tab
3. Agrega las variables
4. El proyecto se redeployará automáticamente

### Netlify
1. Site settings → Environment variables
2. Agrega las variables
3. Redeploy el sitio

## Notas de Desarrollo

- El sistema es completamente independiente de Supabase
- Las credenciales en desarrollo se almacenan en el sistema de archivos
- En producción, usa variables de entorno para persistencia
- El hash de contraseña se genera automáticamente al cambiar credenciales
- No necesitas calcular el hash manualmente
