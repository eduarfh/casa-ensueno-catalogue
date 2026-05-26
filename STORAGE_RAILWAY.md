# Configuración de Storage con Railway Volume

## Resumen

Tu aplicación ahora usa el **Railway Volume** de 50GB montado en `/app/storage` para almacenar las imágenes de productos.

## Arquitectura

### Almacenamiento
- **Volumen Railway**: 50GB montado en `/app/storage`
- **Estructura**: `/app/storage/products/timestamp-filename.ext`
- **Base de datos**: PostgreSQL guarda la ruta relativa en `product_images.image_url`

### Servicio de Archivos
- **API**: `/api/files/[...path]` sirve archivos desde el volumen
- **URLs públicas**: `https://tu-dominio.com/api/files/products/123456-imagen.jpg`
- **Cache**: Headers configurados para cache de 1 año

## Variables de Entorno

```env
# En .env.local (desarrollo)
STORAGE_PATH=/app/storage

# En Railway (producción)
STORAGE_PATH=/app/storage  # Ya configurado por el volumen
```

## Flujo de Upload

1. Usuario sube imagen desde el formulario de producto
2. `POST /api/upload` recibe el archivo
3. Archivo se guarda en `/app/storage/products/timestamp-nombre.jpg`
4. Se inserta registro en `product_images` con:
   - `image_url`: `products/timestamp-nombre.jpg` (ruta relativa)
   - `size`: tamaño en bytes
   - `product_id`: ID del producto
5. Se retorna URL pública: `https://tu-dominio.com/api/files/products/timestamp-nombre.jpg`

## Flujo de Lectura

1. Aplicación lee `product_images.image_url` de la BD
2. `getStoragePublicUrl()` convierte ruta a URL: `/api/files/products/...`
3. Navegador solicita `GET /api/files/products/timestamp-nombre.jpg`
4. API lee archivo de `/app/storage/products/timestamp-nombre.jpg`
5. Retorna archivo con headers de cache

## Archivos Modificados

### Nuevos
- `app/api/files/[...path]/route.ts` - Sirve archivos desde volumen
- `STORAGE_RAILWAY.md` - Esta documentación

### Actualizados
- `lib/storage-utils.ts` - Funciones para URLs y paths
- `app/api/upload/route.ts` - Upload a volumen Railway
- `app/api/storage/usage/route.ts` - Calcula uso desde PostgreSQL
- `.env.local` - Variable `STORAGE_PATH`

## Ventajas del Railway Volume

✅ **50GB de espacio** - Mucho más que Supabase free (1GB)  
✅ **Sin costos adicionales** - Incluido en tu plan de Railway  
✅ **Persistente** - Los archivos sobreviven redeploys  
✅ **Rápido** - Acceso local al filesystem  
✅ **Simple** - No necesitas configurar AWS S3 u otros servicios  

## Desarrollo Local

Para desarrollo local, crea la carpeta de storage:

```bash
# Windows PowerShell
New-Item -ItemType Directory -Force -Path storage/products

# Linux/Mac
mkdir -p storage/products
```

Actualiza `.env.local`:
```env
STORAGE_PATH=./storage
```

## Migración de Imágenes Existentes

Si tienes imágenes en Supabase Storage, necesitas:

1. Descargar todas las imágenes de Supabase
2. Subirlas al volumen de Railway
3. Actualizar las rutas en `product_images`

Script de migración (crear como `scripts/migrate-images.mjs`):

\`\`\`javascript
import { query } from '../lib/db.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const STORAGE_ROOT = process.env.STORAGE_PATH || '/app/storage';
const SUPABASE_URL = 'tu-url-de-supabase';
const BUCKET = 'casaensueno files';

async function migrateImages() {
  // Obtener todas las imágenes
  const result = await query('SELECT * FROM product_images');
  
  for (const img of result.rows) {
    const oldUrl = \`\${SUPABASE_URL}/storage/v1/object/public/\${BUCKET}/\${img.image_url}\`;
    
    // Descargar imagen
    const response = await fetch(oldUrl);
    if (!response.ok) continue;
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Guardar en volumen
    const filePath = join(STORAGE_ROOT, img.image_url);
    await mkdir(join(STORAGE_ROOT, 'products'), { recursive: true });
    await writeFile(filePath, buffer);
    
    console.log(\`Migrated: \${img.image_url}\`);
  }
}

migrateImages();
\`\`\`

## Backup

Para hacer backup de las imágenes:

```bash
# Desde Railway CLI
railway run tar -czf images-backup.tar.gz /app/storage/products

# Descargar
railway run cat images-backup.tar.gz > images-backup.tar.gz
```

## Monitoreo

El dashboard de admin muestra el uso de storage:
- Lee todos los registros de `product_images`
- Suma los tamaños (`size` column)
- Muestra porcentaje usado de 50GB

## Límites

- **Tamaño máximo por archivo**: 10MB (configurable en `app/api/upload/route.ts`)
- **Capacidad total**: 50GB (volumen Railway)
- **Tipos permitidos**: Imágenes (jpg, png, gif, webp, svg)

## Troubleshooting

### Error: "File not found"
- Verifica que el volumen esté montado en `/app/storage`
- Revisa que la ruta en `product_images.image_url` sea correcta

### Error: "Permission denied"
- El volumen debe tener permisos de escritura
- Railway configura esto automáticamente

### Imágenes no cargan
- Verifica que `NEXT_PUBLIC_SITE_URL` esté configurado
- Revisa los logs de `/api/files/[...path]`

## Próximos Pasos

1. ✅ Storage configurado con Railway Volume
2. 🔄 Migrar imágenes existentes de Supabase (si las hay)
3. 🔄 Probar upload de nuevas imágenes
4. 🔄 Verificar que las imágenes se muestren en catálogo

## Alternativas Futuras

Si necesitas más espacio o CDN global, puedes migrar a:
- **AWS S3** + CloudFront
- **Cloudinary** (CDN incluido)
- **Vercel Blob** (si despliegas en Vercel)

El código está preparado para cambiar fácilmente actualizando `lib/storage-utils.ts` y `app/api/upload/route.ts`.
