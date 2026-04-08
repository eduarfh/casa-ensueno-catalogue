# Guía de Deploy - Sistema de Autenticación Admin

Esta guía te ayudará a configurar correctamente las credenciales de administración al hacer deploy de tu aplicación.

## 📋 Antes de Hacer Deploy

### Opción 1: Usar Credenciales por Defecto (Más Simple)

1. Haz el deploy normalmente sin configurar variables de entorno
2. Accede con las credenciales por defecto:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Una vez dentro, cambia las credenciales desde el panel
4. Configura las variables de entorno que te muestre el sistema
5. Haz un redeploy

### Opción 2: Configurar Credenciales Antes del Deploy (Más Seguro)

1. En tu entorno local, cambia las credenciales desde el panel
2. El sistema te mostrará las variables de entorno
3. Copia las variables
4. Configúralas en tu plataforma de hosting antes del deploy
5. Haz el deploy

## 🚀 Configuración por Plataforma

### Vercel

#### Paso 1: Acceder a Variables de Entorno
1. Ve a tu proyecto en Vercel
2. Click en "Settings"
3. Click en "Environment Variables"

#### Paso 2: Agregar Variables
Agrega estas dos variables:

```
ADMIN_USERNAME=tu_usuario
ADMIN_PASSWORD_HASH=tu_hash_generado
```

#### Paso 3: Aplicar a Todos los Entornos
- Marca: Production, Preview, Development
- Click en "Save"

#### Paso 4: Redeploy
- Ve a "Deployments"
- Click en los tres puntos del último deployment
- Click en "Redeploy"

### Railway

#### Paso 1: Acceder a Variables
1. Ve a tu proyecto en Railway
2. Click en la pestaña "Variables"

#### Paso 2: Agregar Variables
Click en "New Variable" para cada una:

```
ADMIN_USERNAME=tu_usuario
ADMIN_PASSWORD_HASH=tu_hash_generado
```

#### Paso 3: Deploy Automático
- Railway redeployará automáticamente

### Netlify

#### Paso 1: Acceder a Variables
1. Ve a "Site settings"
2. Click en "Environment variables"

#### Paso 2: Agregar Variables
Click en "Add a variable" para cada una:

```
ADMIN_USERNAME=tu_usuario
ADMIN_PASSWORD_HASH=tu_hash_generado
```

#### Paso 3: Redeploy
- Ve a "Deploys"
- Click en "Trigger deploy"
- Selecciona "Deploy site"

## 🔑 Obtener el Hash de Contraseña

### Método 1: Desde el Panel (Recomendado)
1. Accede al panel de administración
2. Ve a Configuración (icono 🔑)
3. Cambia tus credenciales
4. El sistema te mostrará el hash automáticamente

### Método 2: Script Manual
Si necesitas generar un hash manualmente:

```bash
npm run generate-hash "tu_contraseña"
```

Ejemplo:
```bash
npm run generate-hash "MiContraseñaSegura123"
```

Output:
```
✅ Hash generado exitosamente

Contraseña: MiContraseñaSegura123
Hash: a1b2c3d4e5f6...

Variables de entorno para producción:
ADMIN_PASSWORD_HASH=a1b2c3d4e5f6...
```

## 📝 Checklist de Deploy

- [ ] Decidir si usar credenciales por defecto o personalizadas
- [ ] Si usas personalizadas, obtener el hash de contraseña
- [ ] Configurar variables de entorno en la plataforma
- [ ] Hacer el deploy
- [ ] Verificar que puedes acceder con las credenciales
- [ ] Si usaste credenciales por defecto, cambiarlas inmediatamente

## ⚠️ Problemas Comunes

### No puedo acceder después del deploy

**Solución:**
1. Verifica que las variables de entorno estén configuradas correctamente
2. Asegúrate de haber hecho un redeploy después de agregar las variables
3. Si no funcionan, elimina las variables y usa las credenciales por defecto

### El sistema no guarda mis credenciales

**En producción:**
- Las credenciales NO se guardan en archivo
- DEBES configurar las variables de entorno
- El sistema te mostrará un modal con las variables necesarias

**En desarrollo:**
- Las credenciales se guardan en `.admin-credentials.json`
- Este archivo NO se sube a git

### Olvidé mi contraseña en producción

**Solución:**
1. Ve a tu plataforma de hosting
2. Elimina las variables `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH`
3. Haz un redeploy
4. Accede con las credenciales por defecto (admin / admin123)
5. Cambia las credenciales inmediatamente

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

**Para un deploy rápido:**
1. Deploy sin variables de entorno
2. Accede con admin / admin123
3. Cambia credenciales desde el panel
4. Configura las variables que te muestre
5. Redeploy
6. ✅ Listo

**Para un deploy seguro:**
1. Cambia credenciales en local
2. Copia las variables de entorno
3. Configúralas en tu plataforma
4. Deploy
5. ✅ Listo
