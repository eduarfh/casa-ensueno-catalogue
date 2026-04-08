-- Crear tabla para almacenar credenciales de administración
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar credenciales por defecto (admin / admin123)
-- Hash SHA-256 de "admin123": 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT INTO admin_credentials (username, password_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (username) DO NOTHING;

-- Deshabilitar RLS para esta tabla (solo accesible con service_role)
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- No crear políticas RLS - solo accesible con service_role key
-- Esto asegura que solo el backend pueda acceder a las credenciales

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_admin_credentials_username ON admin_credentials(username);

-- Comentarios para documentación
COMMENT ON TABLE admin_credentials IS 'Almacena las credenciales únicas del administrador del sistema';
COMMENT ON COLUMN admin_credentials.username IS 'Nombre de usuario del administrador';
COMMENT ON COLUMN admin_credentials.password_hash IS 'Hash SHA-256 de la contraseña';
