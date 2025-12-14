// test-insert-admin.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltan env vars NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey);

(async () => {
  const categoryId = 'f27b03f5-4508-47fc-af90-41c523b63299';
  const ownerId = '8a398039-7aeb-4b02-84ab-2a23a99f1b42';

  const { data, error } = await admin
    .from('products')
    .insert({
      name: 'Producto test admin (script)',
      description: 'Insert con service role',
      price: 19.9,
      category_id: categoryId,
      stock: 3,
      available: true,
      owner_id: ownerId
    })
    .select()
    .single();

  if (error) {
    console.error('Error insert admin:', error);
    process.exit(1);
  }

  console.log('Insert admin ok:', data);
  process.exit(0);
})();
