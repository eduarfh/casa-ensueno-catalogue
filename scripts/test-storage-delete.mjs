// scripts/test-storage-delete.mjs
// Script para probar la eliminación de archivos del storage
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET = 'casaensueno files';

async function testStorageDelete() {
  console.log('🧪 Testing Supabase Storage Delete');
  console.log('Bucket:', BUCKET);
  console.log('');

  // 1. Listar archivos en el bucket
  console.log('📋 Listing files in bucket...');
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list('products', {
      limit: 10,
      offset: 0,
    });

  if (listError) {
    console.error('❌ Error listing files:', listError);
    return;
  }

  console.log(`✅ Found ${files?.length || 0} files`);
  if (files && files.length > 0) {
    console.log('Files:');
    files.forEach((file, i) => {
      console.log(`  ${i + 1}. ${file.name}`);
    });
  }
  console.log('');

  // 2. Intentar eliminar un archivo de prueba (que no existe)
  console.log('🗑️  Testing delete operation...');
  const testPath = 'products/test-file-that-does-not-exist.jpg';
  
  const { data: deleteData, error: deleteError } = await supabase.storage
    .from(BUCKET)
    .remove([testPath]);

  if (deleteError) {
    console.error('❌ Error deleting file:', deleteError);
  } else {
    console.log('✅ Delete operation successful');
    console.log('Response:', deleteData);
  }
  console.log('');

  // 3. Verificar permisos
  console.log('🔐 Checking bucket permissions...');
  const { data: bucket, error: bucketError } = await supabase.storage
    .getBucket(BUCKET);

  if (bucketError) {
    console.error('❌ Error getting bucket info:', bucketError);
  } else {
    console.log('✅ Bucket info:');
    console.log('  Public:', bucket.public);
    console.log('  ID:', bucket.id);
    console.log('  Name:', bucket.name);
  }
}

testStorageDelete().catch(console.error);
