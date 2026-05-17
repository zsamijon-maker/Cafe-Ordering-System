const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const migrationsDir = path.resolve(__dirname, '../../../migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found:', migrationsDir);
    process.exit(1);
  }
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('DATABASE_URL or SUPABASE_DB_URL environment variable is required to run migrations.');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, 'utf8');
    console.log('\n---- Running migration:', file);
    try {
      await client.query(sql);
      console.log('OK');
    } catch (err) {
      console.error('FAILED:', err.message || err);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('\nAll migrations applied successfully.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
