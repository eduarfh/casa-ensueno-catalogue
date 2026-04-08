# Autenticación de Administración - Guía Completa

## 🔐 Inicio de Sesión

Para acceder al panel de administración:

1. Ve a `/auth/login`
2. Usa las credenciales por defecto:
   - **Usuario:** `admin`
   - **Contraseña:** `admin123`

## 📋 Configuración Inicial

### Paso 1: Crear la Tabla en Supabase

Antes de usar el sistema, debes crear la tabla en Supabase:

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Ejecuta el script: `scripts/create-admin-credentials-table.sql`

O copia y pega este SQL:

```sql
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_credentials (username, password_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (username) DO NOTHING;

ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_admin_credentials_username ON admin_credentials(username);
```

### Paso 2: Verificar la Creación

1. Ve a **Table Editor** en Supabase
2. Busca la tabla `admin_credentials`
3. Deberías ver un registro con username = 'admin'

## 🔑 Cambiar Credenciales

### Desde el Panel de Administración

1. Inicia sesión en el panel
2. Haz clic en el icono de llave (🔑) en la barra superior
3. Ingresa tu contraseña actual
4. Define tu nuevo usuario (mínimo 3 caracteres)
5. Define tu nueva contraseña (mínimo 6 caracteres)
6. Confirma la nueva contraseña
7. Haz clic en "Actualizar Credenciales"
8. ✅ Los cambios se guardan automáticamente en Supabase

### Desde Supabase (Método Alternativo)

Si tienes acceso al dashboard de Supabase:

1. Ve al **SQL Editor**
2. Ejecuta este SQL (reemplaza con tus valores):

```sql
UPDATE admin_credentials 
SET username = 'nuevo_usuario',
    password_hash = encode(digest('nueva_contraseña', 'sha256'), 'hex'),
    updated_at = NOW();
```

## 🔄 Restablecer Credenciales

### Método 1: SQL Editor (Recomendado)

```sql
UPDATE admin_credentials 
SET username = 'admin', 
    password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    updated_at = NOW();
```

### Método 2: Table Editor

1. Ve a **Table Editor** en Supabase
2. Abre la tabla `admin_credentials`
3. Edita el registro directamente:
   - username: `admin`
   - password_hash: `240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`

### Método 3: Eliminar y Recrear

```sql
DELETE FROM admin_credentials;

INSERT INTO admin_credentials (username, password_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');
```

## 💡 Generar Hash de Contraseña

### Opción 1: Script Node.js

```bash
npm run generate-hash "tu_contraseña"
```

Ejemplo:
```bash
npm run generate-hash "MiContraseña123"
```

Output:
```
✅ Hash generado exitosamente

Contraseña: MiContraseña123
Hash: a1b2c3d4e5f6...
```

### Opción 2: SQL en Supabase

```sql
SELECT encode(digest('tu_contraseña', 'sha256'), 'hex') as password_hash;
```

## 🚀 Deploy en Producción

### Ventajas del Sistema con Supabase

✅ **Sin configuración adicional**: Las credenciales están en la base de datos  
✅ **Persistencia automática**: Funciona igual en desarrollo y producción  
✅ **Sin variables de entorno**: No necesitas configurar nada en tu plataforma  
✅ **Cambios inmediatos**: Actualiza credenciales sin redeploy  

### Pasos para Deploy

1. **Verifica que la tabla existe** en tu Supabase de producción
2. **Deploy normalmente** (Vercel, Railway, Netlify, etc.)
3. **Accede con las credenciales** (por defecto o las que hayas configurado)
4. ✅ **Listo** - No requiere configuración adicional

### Si la Tabla No Existe en Producción

1. Ve a tu proyecto de Supabase (producción)
2. Ejecuta el script SQL de creación
3. Verifica que el registro se creó correctamente

## ⚠️ Importante

### Seguridad

- Las contraseñas se almacenan hasheadas (SHA-256)
- La tabla usa RLS (Row Level Security)
- Solo accesible con service_role key
- Las cookies de sesión son HTTP-only

### Limitaciones

- Solo un usuario administrador
- Si olvidas la contraseña, necesitas acceso a Supabase
- La tabla debe existir antes de usar la aplicación

### Mejores Prácticas

1. **Cambia las credenciales por defecto inmediatamente**
2. **Usa contraseñas fuertes** (mínimo 12 caracteres)
3. **Guarda tus credenciales** en un gestor de contraseñas
4. **No compartas** las credenciales públicamente
5. **Haz backup** de tu base de datos regularmente

## 🔍 Solución de Problemas

### No puedo acceder

**Problema:** Las credenciales no funcionan

**Solución:**
1. Verifica que la tabla `admin_credentials` existe
2. Verifica que hay un registro en la tabla
3. Intenta con las credenciales por defecto (admin / admin123)
4. Revisa los logs del servidor

### Error: Table 'admin_credentials' does not exist

**Problema:** La tabla no se ha creado

**Solución:**
1. Ejecuta el script SQL de creación
2. O usa el endpoint: `POST /api/auth/init-credentials`
3. Verifica en el Table Editor que la tabla existe

### Olvidé mi contraseña

**Solución:**
1. Ve al SQL Editor en Supabase
2. Ejecuta el SQL de reset (ver sección "Restablecer Credenciales")
3. Accede con admin / admin123
4. Cambia las credenciales inmediatamente

### Los cambios no se guardan

**Problema:** Las credenciales no se actualizan

**Solución:**
1. Verifica que tienes el `SUPABASE_SERVICE_ROLE_KEY` configurado
2. Revisa los logs del servidor para errores
3. Verifica los permisos de la tabla en Supabase

## 📊 Estructura del Sistema

```
Usuario ingresa credenciales
        ↓
POST /api/auth/admin-login
        ↓
lib/admin-auth.ts → validateCredentials()
        ↓
Consulta tabla admin_credentials en Supabase
        ↓
Compara hash de contraseña
        ↓
✅ Válido → Crea cookie de sesión
❌ Inválido → Muestra error
```

## 📁 Archivos del Sistema

- `lib/admin-auth.ts` - Lógica de autenticación
- `scripts/create-admin-credentials-table.sql` - Script SQL
- `app/admin/settings/page.tsx` - Página de configuración
- `app/api/auth/admin-login/route.ts` - Endpoint de login
- `app/api/auth/admin-logout/route.ts` - Endpoint de logout
- `app/api/auth/admin-check/route.ts` - Verificación de sesión
- `app/api/auth/admin-credentials/route.ts` - Gestión de credenciales
- `app/api/auth/init-credentials/route.ts` - Inicialización

## 🎯 Resumen Rápido

**Configuración inicial:**
1. Crear tabla en Supabase
2. Verificar que existe el registro por defecto

**Uso diario:**
1. Login con credenciales
2. Cambiar credenciales desde el panel
3. Los cambios son automáticos

**Recuperación:**
1. Ejecutar SQL de reset en Supabase
2. Acceder con credenciales por defecto
3. Cambiar credenciales

---

Para más información técnica, consulta `README_ADMIN_AUTH.md`
