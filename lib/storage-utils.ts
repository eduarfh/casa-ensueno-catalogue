// lib/storage-utils.ts

/**
 * Converts a storage path to a public URL
 * If the input is already a full URL, returns it as-is
 * 
 * For Railway Volume: paths are stored as relative paths and served via /api/files/[...path]
 */
export function getStoragePublicUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined;
  
  // If already a full URL, return as-is
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  
  // For Railway Volume storage, construct URL to our file serving API
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Remove leading slash if present
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl;
  
  return `${siteUrl}/api/files/${cleanPath}`;
}

/**
 * Extracts the storage path from a full storage URL
 * Returns null if the URL doesn't match expected patterns
 */
export function extractPathFromStorageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    
    // Pattern: /api/files/<path>
    const filesPrefix = '/api/files/';
    if (u.pathname.startsWith(filesPrefix)) {
      return decodeURIComponent(u.pathname.slice(filesPrefix.length));
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the absolute file system path for a storage path
 * Railway volume is mounted at /app/storage
 */
export function getStorageFilePath(relativePath: string): string {
  const storageRoot = process.env.STORAGE_PATH || '/app/storage';
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${storageRoot}/${cleanPath}`;
}
