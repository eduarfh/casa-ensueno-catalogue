// scripts/test-db-connection.mjs
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function testConnection() {
  console.log('🔍 Probando conexión a PostgreSQL...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL no está configurada en .env.local');
    process.exit(1);
  }

  console.log('📝 DATABASE_URL encontrada');
  console.log('🔗 Conectando...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test 1: Conexión básica
    const client = await pool.connect();
    console.log('✅ Conexión establecida exitosamente\n');

    // Test 2: Query de prueba
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query ejecutada exitosamente');
    console.log('⏰ Hora del servidor:', timeResult.rows[0].current_time);
    console.log('');

    // Test 3: Verificar tablas existentes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📊 Tablas encontradas en la base de datos:');
    if (tablesResult.rows.length === 0) {
      console.log('   ⚠️  No hay tablas creadas aún');
      console.log('   💡 Ejecuta los scripts SQL de RAILWAY_SETUP.md para crear las tablas');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    console.log('');

    // Test 4: Verificar tabla admin_credentials
    const adminTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_credentials'
      ) as exists
    `);

    if (adminTableCheck.rows[0].exists) {
      const adminCount = await client.query('SELECT COUNT(*) as count FROM admin_credentials');
      console.log('✅ Tabla admin_credentials existe');
      console.log(`   👤 Administradores registrados: ${adminCount.rows[0].count}`);
    } else {
      console.log('⚠️  Tabla admin_credentials no existe');
      console.log('   💡 Crea la tabla usando el script en RAILWAY_SETUP.md');
    }
    console.log('');

    // Test 5: Verificar tabla products
    const productsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      ) as exists
    `);

    if (productsTableCheck.rows[0].exists) {
      const productsCount = await client.query('SELECT COUNT(*) as count FROM products');
      console.log('✅ Tabla products existe');
      console.log(`   📦 Productos registrados: ${productsCount.rows[0].count}`);
    } else {
      console.log('⚠️  Tabla products no existe');
      console.log('   💡 Crea la tabla usando el script en RAILWAY_SETUP.md');
    }
    console.log('');

    client.release();
    await pool.end();

    console.log('✅ Todas las pruebas completadas exitosamente');
    console.log('🎉 Tu base de datos está lista para usar\n');

  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:\n');
    console.error(error.message);
    console.error('\n💡 Verifica que:');
    console.error('   1. DATABASE_URL esté correctamente configurada en .env.local');
    console.error('   2. El servicio PostgreSQL esté corriendo en Railway');
    console.error('   3. Las credenciales sean correctas\n');
    process.exit(1);
  }
}

testConnection();
