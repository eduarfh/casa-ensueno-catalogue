const fs = require('fs');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('Falta la variable DATABASE_URL');
}

const products = JSON.parse(
  fs.readFileSync('scripts/products.json', 'utf8')
);

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  for (const p of products) {
    await client.query(
      `
      INSERT INTO products (
        id, name, description, price, available, created_at, updated_at, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        available = EXCLUDED.available,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        category = EXCLUDED.category
      `,
      [
        p.id,
        p.name,
        p.description ?? null,
        p.price,
        p.available,
        p.created_at,
        p.updated_at,
        p.category,
      ]
    );
  }

  await client.end();
  console.log(`Importados ${products.length} productos`);
}

main().catch(async (err) => {
  console.error(err);
  try { await client.end(); } catch {}
  process.exit(1);
});