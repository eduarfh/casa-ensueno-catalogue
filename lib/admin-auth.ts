// lib/admin-auth.ts
import * as crypto from 'crypto';
import { query } from '@/lib/db';

interface AdminCredentials {
  username: string;
  passwordHash: string;
}

// Credenciales por defecto (solo se usan si no hay nada en la BD)
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Obtiene las credenciales desde PostgreSQL
 */
async function getCredentials(): Promise<AdminCredentials> {
  try {
    const result = await query(
      'SELECT username, password_hash FROM admin_credentials LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('[admin-auth] No credentials found in database, using defaults');
      return {
        username: DEFAULT_USERNAME,
        passwordHash: hashPassword(DEFAULT_PASSWORD),
      };
    }

    return {
      username: result.rows[0].username,
      passwordHash: result.rows[0].password_hash,
    };
  } catch (error) {
    console.error('[admin-auth] Error fetching credentials from database:', error);
    return {
      username: DEFAULT_USERNAME,
      passwordHash: hashPassword(DEFAULT_PASSWORD),
    };
  }
}

export async function validateCredentials(username: string, password: string): Promise<boolean> {
  const credentials = await getCredentials();
  const passwordHash = hashPassword(password);
  
  return credentials.username === username && credentials.passwordHash === passwordHash;
}

export async function updateCredentials(
  currentPassword: string, 
  newUsername: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credentials = await getCredentials();
    const currentPasswordHash = hashPassword(currentPassword);

    // Verificar contraseña actual
    if (credentials.passwordHash !== currentPasswordHash) {
      return { success: false, error: 'Contraseña actual incorrecta' };
    }

    // Validaciones
    if (!newUsername || newUsername.length < 3) {
      return { success: false, error: 'El usuario debe tener al menos 3 caracteres' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    const newPasswordHash = hashPassword(newPassword);

    // Actualizar en PostgreSQL
    const result = await query(
      'UPDATE admin_credentials SET username = $1, password_hash = $2, updated_at = NOW() WHERE username = $3',
      [newUsername, newPasswordHash, credentials.username]
    );

    if (result.rowCount === 0) {
      return { success: false, error: 'Error al actualizar las credenciales en la base de datos' };
    }

    return { success: true };
  } catch (error) {
    console.error('[admin-auth] Error updating credentials:', error);
    return { success: false, error: 'Error inesperado al actualizar las credenciales' };
  }
}

export async function getCurrentUsername(): Promise<string> {
  const credentials = await getCredentials();
  return credentials.username;
}

/**
 * Inicializa las credenciales por defecto en PostgreSQL si no existen
 */
export async function initializeCredentials(): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si ya existen credenciales
    const result = await query('SELECT id FROM admin_credentials LIMIT 1');

    if (result.rows.length > 0) {
      return { success: true }; // Ya existen credenciales
    }

    // Insertar credenciales por defecto
    await query(
      'INSERT INTO admin_credentials (username, password_hash) VALUES ($1, $2)',
      [DEFAULT_USERNAME, hashPassword(DEFAULT_PASSWORD)]
    );

    return { success: true };
  } catch (error) {
    console.error('[admin-auth] Error initializing credentials:', error);
    return { success: false, error: 'Error al inicializar credenciales' };
  }
}
