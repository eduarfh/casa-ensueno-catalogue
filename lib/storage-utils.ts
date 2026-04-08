// lib/storage-utils.ts

const BUCKET = "casaensueno files";

/**
 * Converts a storage path to a public URL
 * If the input is already a full URL, returns it as-is
 */
export function getStoragePublicUrl(pathOrUrl?: string | null): string | undefined {
  if (!pathOrUrl) return undefined;
  
  // If already a full URL, return as-is
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  
  // Construct public URL from path
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("[getStoragePublicUrl] NEXT_PUBLIC_SUPABASE_URL not set");
    return undefined;
  }
  
  // Encode the bucket name and path properly
  const encodedBucket = encodeURIComponent(BUCKET);
  const encodedPath = pathOrUrl.split('/').map(encodeURIComponent).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

/**
 * Extracts the storage path from a full Supabase storage URL
 * Returns null if the URL doesn't match expected patterns
 */
export function extractPathFromStorageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    
    // Pattern: /storage/v1/object/public/<bucket>/<path>
    const publicPrefix = `/storage/v1/object/public/${BUCKET}/`;
    const idx = u.pathname.indexOf(publicPrefix);
    if (idx !== -1) {
      return decodeURIComponent(u.pathname.slice(idx + publicPrefix.length));
    }
    
    // Pattern: /object/sign/<bucket>/...
    const signPrefix = `/object/sign/${BUCKET}/`;
    const idx2 = u.pathname.indexOf(signPrefix);
    if (idx2 !== -1) {
      return decodeURIComponent(u.pathname.slice(idx2 + signPrefix.length));
    }
    
    // Fallback: split by /<bucket>/
    const parts = u.pathname.split(`/${BUCKET}/`);
    if (parts.length > 1) {
      return decodeURIComponent(parts[1]);
    }
    
    return null;
  } catch {
    return null;
  }
}
