// scripts/update-image-sizes.mjs
import { readFileSync } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';
import pg from 'pg';
const { Pool } = pg;

// Leer configuración
const envPath = '.env.local';
let DATABASE_URL = process.env.DATABASE_URL;
let STORAGE_PATH = process.env.STORAGE_PATH || '/app/storage';

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('DATABASE_URL=')) {
      DATABASE_URL = line.split('=')[1].trim();
    }
    if (line.startsWith('STORAGE_PATH=')) {
      STORAGE_PATH = line.split('=')[1].trim();
    }
  }
} catch (err) {
  console.log('No se pudo leer .env.local, usando variables de entorno');
}

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no está configurado');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function updateImageSizes() {
  try {
    console.log('Conectando a la base de datos...');
    
    // Obtener todas las imágenes sin tamaño
    const result = await pool.query(
      'SELECT id, image_url FROM product_images WHERE size IS NULL OR size = 0'
    );
    
    console.log(`\nEncontradas ${result.rows.length} imágenes sin tamaño registrado\n`);
    
    if (result.rows.length === 0) {
      console.log('✅ Todas las imágenes ya tienen su tamaño registrado');
      return;
    }

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const row of result.rows) {
      const { id, image_url } = row;
      
      try {
        // Construir ruta completa del archivo
        const filePath = join(STORAGE_PATH, image_url);
        
        // Obtener estadísticas del archivo
        const stats = await stat(filePath);
        const fileSize = stats.size;
        
        // Actualizar en la base de datos
        await pool.query(
          'UPDATE product_images SET size = $1 WHERE id = $2',
          [fileSize, id]
        );
        
        updated++;
        console.log(`✅ ${image_url} - ${formatBytes(fileSize)}`);
        
      } catch (err) {
        if (err.code === 'ENOENT') {
          notFound++;
          console.log(`⚠️  ${image_url} - Archivo no encontrado`);
        } else {
          errors++;
          console.error(`❌ ${image_url} - Error:`, err.message);
        }
      }
    }

    console.log('\n=== Resumen ===');
    console.log(`✅ Actualizados: ${updated}`);
    console.log(`⚠️  No encontrados: ${notFound}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📊 Total procesados: ${result.rows.length}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const v = bytes / Math.pow(k, i);
  return `${v.toFixed(2)} ${sizes[i]}`;
}

console.log('=== Actualizar Tamaños de Imágenes ===\n');
console.log(`STORAGE_PATH: ${STORAGE_PATH}`);
console.log(`DATABASE_URL: ${DATABASE_URL ? '✓ Configurado' : '✗ No configurado'}\n`);

updateImageSizes().catch(console.error);
