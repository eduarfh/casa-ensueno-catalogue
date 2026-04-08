# Guía de Deploy - Sistema de Autenticación Admin

Esta guía te ayudará a configurar correctamente tu aplicación para producción.

## 📋 Cómo Funciona la Autenticación

El sistema almacena las credenciales de administración en Supabase (tabla `admin_credentials`):
- Las credenciales se guardan en la base de datos, no en archivos locales
- Si no existen credenciales en la BD, el sistema usa las por defecto: `admin` / `admin123`
- Puedes cambiar las credenciales desde el panel de administración en cualquier momento

## 🔧 Configuración de Supabase

### Paso 1: Crear la Tabla de Credenciales

Ejecuta este SQL en tu proyecto de Supabase (SQL Editor):

```sql
-- Crear tabla para almacenar credenciales de administración
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar credenciales por defecto (admin / admin123)
INSERT INTO admin_credentials (username, password_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (username) DO NOTHING;

-- Habilitar RLS (solo accesible con service_role)
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_admin_credentials_username ON admin_credentials(username);
```

Este script también está disponible en `scripts/create-admin-credentials-table.sql`

## 🚀 Configuración por Plataforma

### Vercel

#### Paso 1: Acceder a Variables de Entorno
1. Ve a tu proyecto en Vercel
2. Click en "Settings"
3. Click en "Environment Variables"

#### Paso 2: Agregar Variables de Supabase
Agrega estas variables (obtenlas de tu proyecto Supabase):

```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SITE_URL=tu_dominio_vercel
```

#### Paso 3: Aplicar a Todos los Entornos
- Marca: Production, Preview, Development
- Click en "Save"

#### Paso 4: Deploy
- Vercel hará el deploy automáticamente
- O ve a "Deployments" y haz "Redeploy"

### Railway

#### Paso 1: Acceder a Variables
1. Ve a tu proyecto en Railway
2. Click en la pestaña "Variables"

#### Paso 2: Agregar Variables de Supabase
Click en "New Variable" para cada una:

```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SITE_URL=tu_dominio
```

#### Paso 3: Deploy Automático
- Railway redeployará automáticamente

### Netlify

#### Paso 1: Acceder a Variables
1. Ve a "Site settings"
2. Click en "Environment variables"

#### Paso 2: Agregar Variables de Supabase
Click en "Add a variable" para cada una:

```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SITE_URL=tu_dominio
```

#### Paso 3: Redeploy
- Ve a "Deploys"
- Click en "Trigger deploy"
- Selecciona "Deploy site"

## 🔐 Gestión de Credenciales

### Acceso Inicial
Después del deploy, accede con las credenciales por defecto:
- Usuario: `admin`
- Contraseña: `admin123`

### Cambiar Credenciales
1. Accede al panel de administración
2. Ve a Configuración (icono 🔑)
3. Ingresa la contraseña actual
4. Define el nuevo usuario y contraseña
5. Las credenciales se actualizan automáticamente en Supabase

### Generar Hash Manualmente (Opcional)
Si necesitas generar un hash SHA-256 manualmente:

```bash
npm run generate-hash "tu_contraseña"
```

Esto te dará el hash que puedes insertar directamente en Supabase si es necesario.

## 📝 Checklist de Deploy

- [ ] Crear la tabla `admin_credentials` en Supabase (ejecutar el SQL)
- [ ] Configurar variables de entorno de Supabase en tu plataforma
- [ ] Hacer el deploy
- [ ] Acceder con credenciales por defecto (`admin` / `admin123`)
- [ ] Cambiar las credenciales desde el panel de administración
- [ ] Verificar que puedes acceder con las nuevas credenciales

## ⚠️ Problemas Comunes

### No puedo acceder después del deploy

**Solución:**
1. Verifica que las variables de entorno de Supabase estén configuradas
2. Asegúrate de haber creado la tabla `admin_credentials` en Supabase
3. Intenta con las credenciales por defecto: `admin` / `admin123`
4. Revisa los logs de tu plataforma para ver errores específicos

### Error: "Cannot connect to Supabase"

**Solución:**
1. Verifica que `NEXT_PUBLIC_SUPABASE_URL` esté correcta
2. Verifica que `NEXT_PUBLIC_SUPABASE_ANON_KEY` esté correcta
3. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté correcta
4. Asegúrate de que las variables estén en el entorno correcto (Production)

### Olvidé mi contraseña en producción

**Solución:**
1. Ve al SQL Editor de Supabase
2. Ejecuta este SQL para resetear a las credenciales por defecto:
```sql
UPDATE admin_credentials 
SET username = 'admin', 
    password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
WHERE id = (SELECT id FROM admin_credentials LIMIT 1);
```
3. Accede con `admin` / `admin123`
4. Cambia las credenciales inmediatamente

## 🔒 Mejores Prácticas de Seguridad

1. **Cambia las credenciales por defecto inmediatamente**
   - Las credenciales por defecto son públicas
   - Cámbialas antes de que tu sitio sea público

2. **Usa contraseñas fuertes**
   - Mínimo 12 caracteres
   - Combina letras, números y símbolos
   - No uses palabras comunes

3. **Guarda tus credenciales de forma segura**
   - Usa un gestor de contraseñas
   - No las compartas en texto plano
   - No las subas a git

4. **Revisa los logs de acceso**
   - Monitorea intentos de acceso fallidos
   - Revisa accesos sospechosos

5. **Mantén las variables de entorno privadas**
   - No las compartas públicamente
   - No las incluyas en screenshots
   - No las pongas en documentación pública

## 📞 Soporte

Si tienes problemas con el deploy:

1. Revisa esta guía completa
2. Verifica los logs de tu plataforma
3. Asegúrate de que las variables estén bien escritas
4. Prueba con las credenciales por defecto primero

## 🎯 Resumen Rápido

**Pasos para deploy:**
1. Ejecuta el SQL en Supabase para crear la tabla `admin_credentials`
2. Configura las variables de entorno de Supabase en tu plataforma
3. Haz el deploy
4. Accede con `admin` / `admin123`
5. Cambia las credenciales desde el panel
6. ✅ Listo y seguro
