# 🔐 Sistema de Autenticación Admin - Resumen

Sistema de autenticación simple almacenado en Supabase para el panel de administración.

## ⚡ Inicio Rápido

### 1. Crear la Tabla en Supabase

Ejecuta el script SQL en tu base de datos de Supabase:

```bash
# El archivo está en: scripts/create-admin-credentials-table.sql
```

O copia y pega este SQL en el SQL Editor de Supabase:

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

### 2. Iniciar la Aplicación

```bash
npm install
npm run dev
```

### 3. Acceder

Ve a `/auth/login` con:
- Usuario: `admin`
- Contraseña: `admin123`

## 🔑 Cambiar Credenciales

1. Click en el icono 🔑 en el header
2. Ingresa contraseña actual
3. Define nuevas credenciales
4. ✅ Los cambios se guardan automáticamente en Supabase

## 📊 Ventajas de Usar Supabase

✅ Persistencia automática en desarrollo y producción  
✅ No requiere configurar variables de entorno  
✅ Los cambios son inmediatos  
✅ Funciona en cualquier plataforma de hosting  
✅ Backup automático con Supabase  
✅ Fácil de resetear desde el SQL Editor  

## 🔄 Resetear Credenciales

### Opción 1: Desde Supabase Dashboard

1. Ve al SQL Editor en Supabase
2. Ejecuta:

```sql
UPDATE admin_credentials 
SET username = 'admin', 
    password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    updated_at = NOW();
```

### Opción 2: Eliminar y Recrear

```sql
DELETE FROM admin_credentials;

INSERT INTO admin_credentials (username, password_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');
```

## 📁 Archivos Clave

- `lib/admin-auth.ts` - Lógica principal (usa Supabase)
- `scripts/create-admin-credentials-table.sql` - Script de creación de tabla
- `app/admin/settings/page.tsx` - Panel de configuración
- `app/api/auth/admin-*` - Endpoints de autenticación

## 🛠️ Scripts Útiles

```bash
npm run generate-hash "contraseña"  # Generar hash de contraseña
```

## 🔐 Seguridad

- Contraseñas hasheadas con SHA-256
- Tabla protegida con RLS (solo accesible con service_role)
- Cookies HTTP-only para sesiones
- Sin exposición de credenciales en el código

## 📝 Estructura de la Tabla

```sql
admin_credentials
├── id (UUID)
├── username (TEXT, UNIQUE)
├── password_hash (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## 🚀 Deploy

1. Asegúrate de que la tabla `admin_credentials` existe en Supabase
2. Deploy normalmente (Vercel, Railway, etc.)
3. Las credenciales funcionarán automáticamente
4. No requiere configuración adicional

## ⚠️ Importante

- La tabla debe existir antes de usar la aplicación
- Solo hay un registro de credenciales (usuario único)
- Los cambios son inmediatos y persistentes
- Usa el service_role key para acceder a la tabla

## 💡 Generar Hash de Contraseña

Si necesitas generar un hash manualmente:

```bash
npm run generate-hash "tu_contraseña"
```

O usa este SQL en Supabase:

```sql
-- Cambiar contraseña a "nueva_contraseña"
UPDATE admin_credentials 
SET password_hash = encode(digest('nueva_contraseña', 'sha256'), 'hex'),
    updated_at = NOW();
```

## 📞 Ayuda Rápida

**¿No puedo acceder?**
- Verifica que la tabla existe en Supabase
- Usa las credenciales por defecto (admin / admin123)
- Revisa los logs del servidor

**¿Olvidé mi contraseña?**
- Ejecuta el SQL de reset en Supabase
- O actualiza directamente desde el Table Editor

**¿La tabla no existe?**
- Ejecuta el script SQL de creación
- O usa el endpoint: `POST /api/auth/init-credentials`

---

Para más detalles, consulta `AUTENTICACION_ADMIN.md`
