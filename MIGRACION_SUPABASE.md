# 🔄 Migración a Supabase - Sistema de Autenticación

## Cambios Realizados

El sistema de autenticación ahora almacena las credenciales en Supabase en lugar de archivos locales o variables de entorno.

## ✅ Ventajas del Nuevo Sistema

| Característica | Antes | Ahora |
|---------------|-------|-------|
| **Almacenamiento** | Archivo local / Variables de entorno | Supabase (base de datos) |
| **Persistencia** | Solo en desarrollo / Requiere config | Automática en todos los entornos |
| **Configuración** | Diferente por entorno | Única para todos |
| **Cambios** | Requiere redeploy en producción | Inmediatos |
| **Backup** | Manual | Automático con Supabase |
| **Recuperación** | Acceso al servidor | SQL Editor en Supabase |

## 📋 Pasos de Migración

### 1. Crear la Tabla en Supabase

Ejecuta este SQL en el SQL Editor de Supabase:

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

### 2. Verificar la Tabla

1. Ve al **Table Editor** en Supabase
2. Busca la tabla `admin_credentials`
3. Verifica que existe un registro con username = 'admin'

### 3. Migrar Credenciales Existentes (Opcional)

Si ya tenías credenciales personalizadas:

#### Opción A: Desde archivo local

Si tienes `.admin-credentials.json`:

```bash
# Ver el contenido
cat .admin-credentials.json

# Copiar el username y password_hash
# Luego ejecutar en Supabase:
```

```sql
UPDATE admin_credentials 
SET username = 'tu_usuario_actual',
    password_hash = 'tu_hash_actual',
    updated_at = NOW();
```

#### Opción B: Desde variables de entorno

Si tenías `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH`:

```sql
UPDATE admin_credentials 
SET username = 'valor_de_ADMIN_USERNAME',
    password_hash = 'valor_de_ADMIN_PASSWORD_HASH',
    updated_at = NOW();
```

### 4. Limpiar Archivos Antiguos (Opcional)

```bash
# Eliminar archivo local (ya no se usa)
rm .admin-credentials.json

# Eliminar variables de entorno (ya no se necesitan)
# En .env.local, eliminar:
# ADMIN_USERNAME=...
# ADMIN_PASSWORD_HASH=...
```

### 5. Probar el Sistema

1. Reinicia la aplicación
2. Ve a `/auth/login`
3. Accede con tus credenciales
4. Verifica que funciona correctamente

## 🔧 Archivos Modificados

### Archivos Actualizados

- `lib/admin-auth.ts` - Ahora usa Supabase
- `app/api/auth/admin-login/route.ts` - Funciones async
- `app/api/auth/admin-credentials/route.ts` - Sin lógica de env vars
- `app/admin/settings/page.tsx` - UI simplificada

### Archivos Nuevos

- `scripts/create-admin-credentials-table.sql` - Script de creación
- `app/api/auth/init-credentials/route.ts` - Endpoint de inicialización

### Archivos Obsoletos (Pueden eliminarse)

- `scripts/init-admin-credentials.js` - Ya no se usa
- `.admin-credentials.json` - Ya no se crea

## 📝 Cambios en la Documentación

Toda la documentación ha sido actualizada:

- `README_ADMIN_AUTH.md` - Guía rápida actualizada
- `AUTENTICACION_ADMIN.md` - Guía completa actualizada
- `MIGRACION_SUPABASE.md` - Este archivo

## 🚀 Deploy Después de la Migración

### Antes (Sistema Antiguo)

1. Cambiar credenciales en local
2. Copiar variables de entorno
3. Configurar en plataforma de hosting
4. Redeploy

### Ahora (Sistema Nuevo)

1. Cambiar credenciales desde el panel
2. ✅ Listo (cambios inmediatos)

No requiere:
- ❌ Configurar variables de entorno
- ❌ Redeploy
- ❌ Acceso a la plataforma de hosting

## 🔐 Seguridad

### Mejoras de Seguridad

✅ Credenciales en base de datos (más seguro que archivos)  
✅ RLS habilitado (solo accesible con service_role)  
✅ Backup automático con Supabase  
✅ Auditoría con timestamps (created_at, updated_at)  
✅ Sin exposición en variables de entorno  

### Consideraciones

- La tabla solo es accesible con `SUPABASE_SERVICE_ROLE_KEY`
- Las contraseñas siguen hasheadas con SHA-256
- Las sesiones siguen usando cookies HTTP-only

## 🔄 Rollback (Si es Necesario)

Si necesitas volver al sistema anterior:

1. Restaura los archivos desde git:
```bash
git checkout HEAD~1 lib/admin-auth.ts
git checkout HEAD~1 app/api/auth/admin-login/route.ts
git checkout HEAD~1 app/api/auth/admin-credentials/route.ts
```

2. Ejecuta:
```bash
npm run init-admin
```

3. Configura las variables de entorno si es producción

## ❓ Preguntas Frecuentes

### ¿Necesito hacer algo en producción?

Solo asegúrate de que la tabla `admin_credentials` existe en tu Supabase de producción. El resto funciona automáticamente.

### ¿Puedo usar credenciales diferentes en dev y prod?

Sí, si usas proyectos de Supabase diferentes para dev y prod, cada uno tendrá sus propias credenciales.

### ¿Qué pasa con mis credenciales actuales?

Si ya tenías credenciales personalizadas, sigue los pasos de migración para transferirlas a Supabase.

### ¿Es más seguro que antes?

Sí, las credenciales están en una base de datos con RLS, backup automático, y sin exposición en archivos o variables de entorno.

### ¿Necesito redeploy después de cambiar credenciales?

No, los cambios son inmediatos en todos los entornos.

## 📞 Soporte

Si tienes problemas con la migración:

1. Verifica que la tabla existe en Supabase
2. Revisa los logs del servidor
3. Consulta `AUTENTICACION_ADMIN.md` para solución de problemas
4. Verifica que `SUPABASE_SERVICE_ROLE_KEY` está configurado

---

La migración está completa. El sistema ahora es más simple, seguro y fácil de mantener.
