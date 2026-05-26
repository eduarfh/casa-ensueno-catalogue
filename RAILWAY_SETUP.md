# Configuración de Railway PostgreSQL

## Variables de Entorno Requeridas

Railway te proporciona automáticamente estas variables cuando creas un servicio PostgreSQL:

- `PGHOST` - Host de la base de datos
- `PGPORT` - Puerto (usualmente 5432)
- `PGUSER` - Usuario de PostgreSQL
- `PGPASSWORD` - Contraseña
- `PGDATABASE` - Nombre de la base de datos
- `DATABASE_URL` - URL completa de conexión

## Configuración en tu Proyecto

### 1. Copia la DATABASE_URL

En Railway, ve a tu servicio PostgreSQL → Variables → Copia el valor de `DATABASE_URL`

### 2. Actualiza tu `.env.local`

\`\`\`env
DATABASE_URL=postgresql://postgres:password@host:port/database
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 3. Para producción en Railway

Railway inyecta automáticamente las variables de entorno. Solo asegúrate de que tu servicio Next.js tenga acceso al servicio PostgreSQL:

1. Ve a tu proyecto en Railway
2. Conecta tu servicio Next.js con el servicio PostgreSQL
3. Railway automáticamente compartirá las variables

## Estructura de Base de Datos

### Tablas Requeridas

Ejecuta estos scripts SQL en tu base de datos de Railway:

#### 1. Tabla de Productos
\`\`\`sql
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  available BOOLEAN DEFAULT true,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

#### 2. Tabla de Imágenes de Productos
\`\`\`sql
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

#### 3. Tabla de Credenciales de Admin
\`\`\`sql
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

#### 4. Tabla de Información de Tienda
\`\`\`sql
CREATE TABLE IF NOT EXISTS store_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  description TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

#### 5. Tabla de Categorías (opcional)
\`\`\`sql
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_int SERIAL UNIQUE,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### Índices para Mejor Performance

\`\`\`sql
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(display_order);
\`\`\`

### Triggers para updated_at

\`\`\`sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_credentials_updated_at BEFORE UPDATE ON admin_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_info_updated_at BEFORE UPDATE ON store_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
\`\`\`

## Insertar Datos Iniciales

### Admin por defecto
\`\`\`sql
INSERT INTO admin_credentials (username, password_hash)
VALUES ('admin', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
ON CONFLICT (username) DO NOTHING;
-- Contraseña: admin123 (hash SHA-256)
\`\`\`

### Información de tienda inicial
\`\`\`sql
INSERT INTO store_info (name, description)
VALUES ('Mi Tienda', 'Descripción de mi tienda')
ON CONFLICT DO NOTHING;
\`\`\`

## Conexión desde Railway CLI

\`\`\`bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar a tu proyecto
railway link

# Abrir shell de PostgreSQL
railway run psql $DATABASE_URL
\`\`\`

## Verificar Conexión

Crea un archivo de prueba:

\`\`\`typescript
// scripts/test-db-connection.ts
import { query } from '../lib/db';

async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    console.log('✅ Conexión exitosa:', result.rows[0]);
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
  process.exit(0);
}

testConnection();
\`\`\`

Ejecutar:
\`\`\`bash
npx tsx scripts/test-db-connection.ts
\`\`\`

## Troubleshooting

### Error: "no pg_hba.conf entry"
- Verifica que tu IP esté permitida en Railway
- Railway usualmente permite todas las conexiones por defecto

### Error: "Connection timeout"
- Verifica que el `PGHOST` y `PGPORT` sean correctos
- Asegúrate de que el servicio PostgreSQL esté corriendo

### Error: "SSL required"
- Agrega `?sslmode=require` al final de tu DATABASE_URL
- O configura SSL en `lib/db.ts`:
  \`\`\`typescript
  ssl: { rejectUnauthorized: false }
  \`\`\`

## Backup y Restore

### Backup
\`\`\`bash
railway run pg_dump $DATABASE_URL > backup.sql
\`\`\`

### Restore
\`\`\`bash
railway run psql $DATABASE_URL < backup.sql
\`\`\`
