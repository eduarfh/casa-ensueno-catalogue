# Helpers de Migración - Supabase a PostgreSQL

## Conversiones Comunes

### SELECT Queries

#### Supabase
\`\`\`typescript
const { data, error } = await supabase
  .from("products")
  .select("*")
  .eq("id", id)
  .single();
\`\`\`

#### PostgreSQL
\`\`\`typescript
const result = await query('SELECT * FROM products WHERE id = $1', [id]);
const data = result.rows[0];
\`\`\`

---

### SELECT con JOIN

#### Supabase
\`\`\`typescript
const { data, error } = await supabase
  .from("products")
  .select("*, product_images(*)")
  .eq("id", id)
  .single();
\`\`\`

#### PostgreSQL
\`\`\`typescript
const result = await query(`
  SELECT p.*, 
    json_agg(
      json_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'display_order', pi.display_order
      ) ORDER BY pi.display_order
    ) as images
  FROM products p
  LEFT JOIN product_images pi ON p.id = pi.product_id
  WHERE p.id = $1
  GROUP BY p.id
`, [id]);
const data = result.rows[0];
\`\`\`

---

### INSERT

#### Supabase
\`\`\`typescript
const { data, error } = await supabase
  .from("products")
  .insert({ name, price, category })
  .select()
  .single();
\`\`\`

#### PostgreSQL
\`\`\`typescript
const result = await query(
  'INSERT INTO products (name, price, category) VALUES ($1, $2, $3) RETURNING *',
  [name, price, category]
);
const data = result.rows[0];
\`\`\`

---

### UPDATE

#### Supabase
\`\`\`typescript
const { data, error } = await supabase
  .from("products")
  .update({ name, price })
  .eq("id", id)
  .select()
  .single();
\`\`\`

#### PostgreSQL
\`\`\`typescript
const result = await query(
  'UPDATE products SET name = $1, price = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
  [name, price, id]
);
const data = result.rows[0];
\`\`\`

---

### DELETE

#### Supabase
\`\`\`typescript
const { error } = await supabase
  .from("products")
  .delete()
  .eq("id", id);
\`\`\`

#### PostgreSQL
\`\`\`typescript
await query('DELETE FROM products WHERE id = $1', [id]);
\`\`\`

---

### SELECT con ORDER BY

#### Supabase
\`\`\`typescript
const { data, error } = await supabase
  .from("products")
  .select("*")
  .order("created_at", { ascending: false });
\`\`\`

#### PostgreSQL
\`\`\`typescript
const result = await query('SELECT * FROM products ORDER BY created_at DESC');
const data = result.rows;
\`\`\`

---

### SELECT con LIMIT

#### Supabase
\`\`\`typescript
const { data, error } = await supabase
  .from("products")
  .select("*")
  .limit(10);
\`\`\`

#### PostgreSQL
\`\`\`typescript
const result = await query('SELECT * FROM products LIMIT 10');
const data = result.rows;
\`\`\`

---

### SELECT con múltiples condiciones

#### Supabase
\`\`\`typescript
const { data, error } = await supabase
  .from("products")
  .select("*")
  .eq("category", category)
  .eq("available", true);
\`\`\`

#### PostgreSQL
\`\`\`typescript
const result = await query(
  'SELECT * FROM products WHERE category = $1 AND available = $2',
  [category, true]
);
const data = result.rows;
\`\`\`

---

### SELECT con LIKE (búsqueda)

#### Supabase
\`\`\`typescript
const { data, error } = await supabase
  .from("products")
  .select("*")
  .ilike("name", `%${searchTerm}%`);
\`\`\`

#### PostgreSQL
\`\`\`typescript
const result = await query(
  'SELECT * FROM products WHERE name ILIKE $1',
  [`%${searchTerm}%`]
);
const data = result.rows;
\`\`\`

---

### COUNT

#### Supabase
\`\`\`typescript
const { count, error } = await supabase
  .from("products")
  .select("*", { count: "exact", head: true });
\`\`\`

#### PostgreSQL
\`\`\`typescript
const result = await query('SELECT COUNT(*) as count FROM products');
const count = parseInt(result.rows[0].count);
\`\`\`

---

## Manejo de Errores

### Supabase
\`\`\`typescript
const { data, error } = await supabase.from("products").select("*");
if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
\`\`\`

### PostgreSQL
\`\`\`typescript
try {
  const result = await query('SELECT * FROM products');
  const data = result.rows;
} catch (error) {
  console.error('Database error:', error);
  return NextResponse.json({ 
    error: error instanceof Error ? error.message : 'Database error' 
  }, { status: 500 });
}
\`\`\`

---

## Transacciones

### PostgreSQL con transacciones
\`\`\`typescript
import { getClient } from '@/lib/db';

const client = await getClient();
try {
  await client.query('BEGIN');
  
  const product = await client.query(
    'INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *',
    [name, price]
  );
  
  await client.query(
    'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)',
    [product.rows[0].id, imageUrl]
  );
  
  await client.query('COMMIT');
  return product.rows[0];
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
\`\`\`
