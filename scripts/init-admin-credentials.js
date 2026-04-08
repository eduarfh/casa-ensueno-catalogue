// scripts/init-admin-credentials.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CREDENTIALS_FILE = path.join(process.cwd(), '.admin-credentials.json');
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function initCredentials() {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    console.log('✓ El archivo de credenciales ya existe');
    try {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      console.log(`  Usuario actual: ${data.username}`);
    } catch (error) {
      console.error('✗ Error al leer el archivo de credenciales:', error.message);
    }
    return;
  }

  const credentials = {
    username: DEFAULT_USERNAME,
    passwordHash: hashPassword(DEFAULT_PASSWORD),
  };

  try {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
    console.log('✓ Archivo de credenciales creado exitosamente');
    console.log(`  Usuario: ${DEFAULT_USERNAME}`);
    console.log(`  Contraseña: ${DEFAULT_PASSWORD}`);
    console.log('\n⚠️  IMPORTANTE: Cambia estas credenciales desde el panel de administración');
  } catch (error) {
    console.error('✗ Error al crear el archivo de credenciales:', error.message);
    process.exit(1);
  }
}

initCredentials();
