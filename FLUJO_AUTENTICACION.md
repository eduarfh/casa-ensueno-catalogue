# 🔄 Flujo de Autenticación - Diagrama Visual

## 📊 Flujo Completo del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    INICIO DE SESIÓN                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    /auth/login (página)
                              ↓
                Usuario ingresa credenciales
                              ↓
                    POST /api/auth/admin-login
                              ↓
                  lib/admin-auth.ts valida
                              ↓
                ┌─────────────┴─────────────┐
                ↓                           ↓
         ✅ Válidas                    ❌ Inválidas
                ↓                           ↓
    Crea cookie de sesión            Muestra error
                ↓
         Redirige a /admin
                ↓
    ┌───────────────────────────┐
    │   PANEL DE ADMINISTRACIÓN  │
    └───────────────────────────┘
```

## 🔐 Flujo de Validación de Credenciales

```
┌─────────────────────────────────────────────────────────────────┐
│              lib/admin-auth.ts → getCredentials()                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
¿Existen variables de entorno?              ¿Existe archivo local?
(ADMIN_USERNAME, ADMIN_PASSWORD_HASH)       (.admin-credentials.json)
        ↓                                           ↓
    ✅ SÍ → Usar variables                      ✅ SÍ → Leer archivo
        ↓                                           ↓
    ❌ NO ────────────────┐                     ❌ NO
                          ↓                         ↓
                    Usar credenciales por defecto
                    (admin / admin123)
                          ↓
                    Crear archivo en desarrollo
```

## 🔄 Flujo de Cambio de Credenciales

### En Desarrollo (Local)

```
Usuario en /admin/settings
        ↓
Ingresa contraseña actual + nuevas credenciales
        ↓
POST /api/auth/admin-credentials
        ↓
lib/admin-auth.ts → updateCredentials()
        ↓
¿Es desarrollo?
        ↓
    ✅ SÍ
        ↓
Guardar en .admin-credentials.json
        ↓
Actualizar cookie de sesión
        ↓
✅ Credenciales actualizadas
```

### En Producción (Deploy)

```
Usuario en /admin/settings
        ↓
Ingresa contraseña actual + nuevas credenciales
        ↓
POST /api/auth/admin-credentials
        ↓
lib/admin-auth.ts → updateCredentials()
        ↓
¿Es producción?
        ↓
    ✅ SÍ
        ↓
Generar hash de nueva contraseña
        ↓
Devolver variables de entorno al frontend
        ↓
Mostrar modal con variables:
  ADMIN_USERNAME=nuevo_usuario
  ADMIN_PASSWORD_HASH=nuevo_hash
        ↓
Usuario copia las variables
        ↓
Usuario configura en plataforma de hosting
        ↓
Usuario hace redeploy
        ↓
✅ Nuevas credenciales activas
```

## 🎯 Prioridad de Credenciales

```
┌─────────────────────────────────────────────────────────────────┐
│                    BÚSQUEDA DE CREDENCIALES                      │
└─────────────────────────────────────────────────────────────────┘

1️⃣ PRIORIDAD ALTA
   Variables de Entorno (Producción)
   ├─ ADMIN_USERNAME
   └─ ADMIN_PASSWORD_HASH
          ↓
   ✅ ¿Existen? → Usar estas
   ❌ ¿No existen? → Siguiente

2️⃣ PRIORIDAD MEDIA
   Archivo Local (Desarrollo)
   └─ .admin-credentials.json
          ↓
   ✅ ¿Existe? → Usar estas
   ❌ ¿No existe? → Siguiente

3️⃣ PRIORIDAD BAJA
   Credenciales por Defecto
   ├─ Usuario: admin
   └─ Contraseña: admin123
          ↓
   Crear archivo en desarrollo
```

## 🔒 Flujo de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALMACENAMIENTO SEGURO                         │
└─────────────────────────────────────────────────────────────────┘

Contraseña en texto plano
        ↓
crypto.createHash('sha256')
        ↓
Hash SHA-256 (64 caracteres hexadecimales)
        ↓
┌───────────────┴───────────────┐
↓                               ↓
DESARROLLO                  PRODUCCIÓN
        ↓                       ↓
.admin-credentials.json    Variables de Entorno
        ↓                       ↓
{                          ADMIN_USERNAME=...
  "username": "...",       ADMIN_PASSWORD_HASH=...
  "passwordHash": "..."
}
        ↓                       ↓
NO se sube a git           Configurado en plataforma
(.gitignore)               (Vercel, Railway, etc.)
```

## 🚀 Flujo de Deploy

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESO DE DEPLOY                             │
└─────────────────────────────────────────────────────────────────┘

OPCIÓN A: Deploy Simple
        ↓
Deploy sin variables de entorno
        ↓
Aplicación usa credenciales por defecto
        ↓
Usuario accede con admin/admin123
        ↓
Usuario cambia credenciales desde panel
        ↓
Sistema muestra modal con variables
        ↓
Usuario configura variables en plataforma
        ↓
Redeploy
        ↓
✅ Credenciales personalizadas activas

─────────────────────────────────────────

OPCIÓN B: Deploy Seguro
        ↓
En desarrollo local:
  - Cambiar credenciales desde panel
  - Copiar variables de entorno mostradas
        ↓
Configurar variables en plataforma ANTES del deploy
        ↓
Deploy
        ↓
✅ Aplicación usa credenciales personalizadas desde el inicio
```

## 🔄 Flujo de Recuperación

```
┌─────────────────────────────────────────────────────────────────┐
│              RECUPERACIÓN DE CONTRASEÑA OLVIDADA                 │
└─────────────────────────────────────────────────────────────────┘

DESARROLLO:
        ↓
rm .admin-credentials.json
        ↓
npm run init-admin
        ↓
✅ Credenciales por defecto restauradas

─────────────────────────────────────────

PRODUCCIÓN:
        ↓
Ir a plataforma de hosting
        ↓
Eliminar variables:
  - ADMIN_USERNAME
  - ADMIN_PASSWORD_HASH
        ↓
Redeploy
        ↓
✅ Credenciales por defecto activas
        ↓
Cambiar credenciales inmediatamente
```

## 📝 Resumen de Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                                 │
└─────────────────────────────────────────────────────────────────┘

POST /api/auth/admin-login
  ├─ Input: { username, password }
  ├─ Valida credenciales
  ├─ Crea cookie de sesión
  └─ Output: { success: true }

POST /api/auth/admin-logout
  ├─ Elimina cookie de sesión
  └─ Output: { success: true }

GET /api/auth/admin-check
  ├─ Verifica cookie de sesión
  └─ Output: { isAdmin: boolean }

GET /api/auth/admin-credentials
  ├─ Requiere sesión activa
  └─ Output: { username: "..." }

POST /api/auth/admin-credentials
  ├─ Input: { currentPassword, newUsername, newPassword }
  ├─ Valida contraseña actual
  ├─ Actualiza credenciales
  └─ Output: { success: true, envVars?: {...} }
```

## 🎨 Flujo de UI

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERFAZ DE USUARIO                           │
└─────────────────────────────────────────────────────────────────┘

/auth/login
  ├─ Formulario de login
  ├─ Campos: usuario, contraseña
  └─ Muestra credenciales por defecto

/admin
  ├─ AdminGuard (verifica sesión)
  ├─ AdminHeader (con icono 🔑)
  └─ Contenido del panel

/admin/settings
  ├─ AdminGuard (verifica sesión)
  ├─ Formulario de cambio de credenciales
  ├─ Campos:
  │   ├─ Contraseña actual
  │   ├─ Nuevo usuario
  │   ├─ Nueva contraseña
  │   └─ Confirmar contraseña
  └─ Modal con variables (si es producción)
```

---

Este diagrama muestra el flujo completo del sistema de autenticación.
Para más detalles técnicos, consulta los archivos de documentación.
