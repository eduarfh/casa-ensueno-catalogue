# 📚 Índice de Documentación - Casa Ensueño Catalogue

Guía completa del sistema de catálogo y administración.

## 🚀 Inicio Rápido

**¿Primera vez?** Empieza aquí:
- [`RESUMEN_CAMBIOS.md`](RESUMEN_CAMBIOS.md) - Estado actual del proyecto y migración
- [`RAILWAY_SETUP.md`](RAILWAY_SETUP.md) - Configuración de base de datos

## 📖 Documentación por Tema

### Migración a PostgreSQL (Railway)

1. **Resumen de Cambios**
   - [`RESUMEN_CAMBIOS.md`](RESUMEN_CAMBIOS.md)
   - Estado de la migración
   - Archivos actualizados y pendientes
   - Próximos pasos

2. **Configuración de Railway**
   - [`RAILWAY_SETUP.md`](RAILWAY_SETUP.md)
   - Variables de entorno
   - Scripts SQL para crear tablas
   - Troubleshooting

3. **Guía de Migración**
   - [`MIGRACION_POSTGRESQL.md`](MIGRACION_POSTGRESQL.md)
   - Archivos pendientes de migrar
   - Patrones de conversión
   - Estado detallado

4. **Helpers de Migración**
   - [`scripts/migration-helpers.md`](scripts/migration-helpers.md)
   - Ejemplos de conversión Supabase → PostgreSQL
   - Patrones comunes (SELECT, INSERT, UPDATE, DELETE)

### Autenticación Admin

5. **Guía Rápida en Español**
   - [`AUTENTICACION_ADMIN.md`](AUTENTICACION_ADMIN.md)
   - Cómo usar el sistema
   - Cambiar credenciales
   - Solución de problemas comunes

6. **Guía de Deploy**
   - [`DEPLOY_GUIDE.md`](DEPLOY_GUIDE.md)
   - Configuración en Vercel, Railway, Netlify
   - Paso a paso para producción
   - Checklist completo

### Para Desarrolladores

7. **Documentación Técnica**
   - [`ADMIN_AUTH_README.md`](ADMIN_AUTH_README.md)
   - Arquitectura del sistema
   - Archivos importantes
   - Seguridad y mejores prácticas

8. **Flujo del Sistema**
   - [`FLUJO_AUTENTICACION.md`](FLUJO_AUTENTICACION.md)
   - Diagramas visuales
   - Flujo de datos
   - Endpoints API

## 🎯 Guías por Caso de Uso

### Setup Inicial

```
1. Configurar Base de Datos
   → RAILWAY_SETUP.md (Variables de Entorno)
   → RAILWAY_SETUP.md (Estructura de Base de Datos)

2. Verificar Conexión
   → npm run test-db

3. Crear Tablas
   → RAILWAY_SETUP.md (Scripts SQL)

4. Insertar Admin
   → RAILWAY_SETUP.md (Datos Iniciales)
```

### Desarrollo Local

```
1. Configurar .env.local
   → .env.example

2. Verificar conexión
   → npm run test-db

3. Iniciar desarrollo
   → npm run dev
```

### Migración de Archivos

```
1. Ver archivos pendientes
   → MIGRACION_POSTGRESQL.md

2. Consultar patrones
   → scripts/migration-helpers.md

3. Actualizar archivo
   → Seguir ejemplos de conversión

4. Probar cambios
   → npm run dev
```

### Deploy a Producción

```
1. Preparación
   → DEPLOY_GUIDE.md (Antes de Hacer Deploy)

2. Configuración Railway
   → RAILWAY_SETUP.md (Para producción en Railway)

3. Verificación
   → DEPLOY_GUIDE.md (Checklist de Deploy)
```

## 📁 Estructura de Archivos

```
Documentación:
├── RESUMEN_CAMBIOS.md            ⭐ Estado actual
├── RAILWAY_SETUP.md              🗄️ Setup de base de datos
├── MIGRACION_POSTGRESQL.md       🔄 Guía de migración
├── scripts/migration-helpers.md  📝 Ejemplos de conversión
├── AUTENTICACION_ADMIN.md        📱 Guía de usuario
├── DEPLOY_GUIDE.md               🚀 Guía de deploy
├── ADMIN_AUTH_README.md          🔧 Documentación técnica
├── FLUJO_AUTENTICACION.md        📊 Diagramas de flujo
└── DOCS_INDEX.md                 📚 Este archivo

Código - Base de Datos:
├── lib/
│   ├── db.ts                     🗄️ Pool de conexiones PostgreSQL
│   ├── db-helpers.ts             🛠️ Helpers para queries
│   └── admin-auth.ts             🔐 Autenticación (migrado)

Código - APIs (Migradas):
├── app/api/
│   └── products/route.ts         ✅ Migrado a PostgreSQL

Código - APIs (Pendientes):
├── app/api/
│   ├── products/[id]/route.ts    🔄 Pendiente
│   ├── products/search/route.ts  🔄 Pendiente
│   ├── admin/*                   🔄 Pendiente
│   ├── auth/*                    🔄 Pendiente
│   └── ...                       🔄 Ver MIGRACION_POSTGRESQL.md

Scripts:
├── scripts/
│   ├── test-db-connection.mjs    🧪 Verificar conexión
│   ├── generate-password-hash.js 🔧 Generar hash
│   └── migration-helpers.md      📖 Guía de conversión

Configuración:
├── .env.local                    🔐 Variables de entorno
├── .env.example                  📝 Ejemplo de variables
└── package.json                  📦 Scripts npm
```

## 🔍 Búsqueda Rápida

### ¿Cómo...?

**...configurar la base de datos?**
→ `RAILWAY_SETUP.md` → Variables de Entorno

**...verificar la conexión?**
→ `npm run test-db`

**...crear las tablas?**
→ `RAILWAY_SETUP.md` → Estructura de Base de Datos

**...migrar un archivo de Supabase a PostgreSQL?**
→ `scripts/migration-helpers.md` → Ejemplos
→ `MIGRACION_POSTGRESQL.md` → Archivos pendientes

**...ver el estado de la migración?**
→ `RESUMEN_CAMBIOS.md`

**...cambiar credenciales de admin?**
→ `AUTENTICACION_ADMIN.md` → En Desarrollo/Producción

**...hacer deploy?**
→ `DEPLOY_GUIDE.md` → Completo

**...generar un hash de contraseña?**
→ `npm run generate-hash`

**...hacer backup de la base de datos?**
→ `RAILWAY_SETUP.md` → Backup y Restore

## 🎓 Niveles de Documentación

### Nivel 1: Setup Inicial
- `RESUMEN_CAMBIOS.md` - Estado actual
- `RAILWAY_SETUP.md` - Configuración DB
- `npm run test-db` - Verificación

### Nivel 2: Desarrollo
- `MIGRACION_POSTGRESQL.md` - Archivos pendientes
- `scripts/migration-helpers.md` - Patrones de conversión
- `AUTENTICACION_ADMIN.md` - Uso del sistema

### Nivel 3: Deploy y Producción
- `DEPLOY_GUIDE.md` - Deploy completo
- `RAILWAY_SETUP.md` - Configuración producción

### Nivel 4: Arquitectura
- `ADMIN_AUTH_README.md` - Documentación técnica
- `FLUJO_AUTENTICACION.md` - Diagramas
- Código fuente en `lib/` y `app/`

## 🚀 Comandos Útiles

```bash
# Verificar conexión a base de datos
npm run test-db

# Generar hash de contraseña
npm run generate-hash

# Desarrollo
npm run dev

# Build
npm run build

# Buscar archivos que usan Supabase
grep -r "from '@/lib/supabase" app/ lib/ --include="*.ts" --include="*.tsx"
```

## 📊 Estado del Proyecto

**Progreso de Migración: ~15%**

- ✅ Infraestructura base (db, helpers, auth)
- ✅ 1 API migrada (products route)
- 🔄 ~30 archivos pendientes

Ver detalles en [`RESUMEN_CAMBIOS.md`](RESUMEN_CAMBIOS.md)

## 📞 Soporte

Si no encuentras lo que buscas:

1. **Revisa el índice de búsqueda rápida** arriba
2. **Consulta RESUMEN_CAMBIOS.md** para el estado actual
3. **Lee RAILWAY_SETUP.md** para troubleshooting de DB
4. **Revisa los ejemplos** en `scripts/migration-helpers.md`

## 🔄 Próximos Pasos

1. ✅ Verificar conexión: `npm run test-db`
2. ✅ Crear tablas en Railway (ver RAILWAY_SETUP.md)
3. 🔄 Decidir solución de almacenamiento de imágenes
4. 🔄 Continuar migración de APIs (ver MIGRACION_POSTGRESQL.md)

---

**Sugerencia:** Guarda este archivo como referencia para navegar toda la documentación.
