// lib/admin-auth.ts
import * as crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

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
 * Obtiene las credenciales desde Supabase
 */
async function getCredentials(): Promise<AdminCredentials> {
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('admin_credentials')
      .select('username, password_hash')
      .single();

    if (error) {
      console.error('[admin-auth] Error fetching credentials from Supabase:', error);
      // Si no existe la tabla o no hay datos, usar credenciales por defecto
      return {
        username: DEFAULT_USERNAME,
        passwordHash: hashPassword(DEFAULT_PASSWORD),
      };
    }

    if (data) {
      return {
        username: data.username,
        passwordHash: data.password_hash,
      };
    }

    // Si no hay datos, retornar credenciales por defecto
    return {
      username: DEFAULT_USERNAME,
      passwordHash: hashPassword(DEFAULT_PASSWORD),
    };
  } catch (error) {
    console.error('[admin-auth] Unexpected error getting credentials:', error);
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
    const supabase = createAdminClient();

    // Actualizar en Supabase
    const { error } = await supabase
      .from('admin_credentials')
      .update({
        username: newUsername,
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('username', credentials.username);

    if (error) {
      console.error('[admin-auth] Error updating credentials in Supabase:', error);
      return { success: false, error: 'Error al actualizar las credenciales en la base de datos' };
    }

    return { success: true };
  } catch (error) {
    console.error('[admin-auth] Unexpected error updating credentials:', error);
    return { success: false, error: 'Error inesperado al actualizar las credenciales' };
  }
}

export async function getCurrentUsername(): Promise<string> {
  const credentials = await getCredentials();
  return credentials.username;
}

/**
 * Inicializa las credenciales por defecto en Supabase si no existen
 */
export async function initializeCredentials(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    
    // Verificar si ya existen credenciales
    const { data: existing } = await supabase
      .from('admin_credentials')
      .select('id')
      .single();

    if (existing) {
      return { success: true }; // Ya existen credenciales
    }

    // Insertar credenciales por defecto
    const { error } = await supabase
      .from('admin_credentials')
      .insert({
        username: DEFAULT_USERNAME,
        password_hash: hashPassword(DEFAULT_PASSWORD),
      });

    if (error) {
      console.error('[admin-auth] Error initializing credentials:', error);
      return { success: false, error: 'Error al inicializar credenciales' };
    }

    return { success: true };
  } catch (error) {
    console.error('[admin-auth] Unexpected error initializing credentials:', error);
    return { success: false, error: 'Error inesperado al inicializar credenciales' };
  }
}
