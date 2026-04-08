// scripts/generate-password-hash.js
// Script para generar el hash de una contraseña manualmente
// Uso: node scripts/generate-password-hash.js "tu_contraseña"

const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const password = process.argv[2];

if (!password) {
  console.log('❌ Error: Debes proporcionar una contraseña');
  console.log('\nUso:');
  console.log('  node scripts/generate-password-hash.js "tu_contraseña"');
  console.log('\nEjemplo:');
  console.log('  node scripts/generate-password-hash.js "admin123"');
  process.exit(1);
}

const hash = hashPassword(password);

console.log('\n✅ Hash generado exitosamente\n');
console.log('Contraseña:', password);
console.log('Hash:', hash);
console.log('\nVariables de entorno para producción:');
console.log('ADMIN_PASSWORD_HASH=' + hash);
console.log('\n⚠️  Guarda este hash de forma segura');
