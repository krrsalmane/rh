import { readFileSync } from 'fs';
import { resolve } from 'path';
import pool from '../config/database';

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migrations...');
    const migrationSQL = readFileSync(
      resolve(__dirname, '../database/migrations/001_initial_schema.sql'),
      'utf-8'
    );
    await client.query(migrationSQL);
    console.log('✅ Migrations completed successfully');

    console.log('🔄 Running seeds...');
    const seedFiles = [
      '../database/seeds/001_admin_user.sql',
      '../database/seeds/002_leave_types.sql',
    ];

    for (const seedFile of seedFiles) {
      const seedSQL = readFileSync(resolve(__dirname, seedFile), 'utf-8');
      await client.query(seedSQL);
      console.log(`  ✅ Seed: ${seedFile}`);
    }

    console.log('✅ All seeds completed successfully');
  } catch (error) {
    console.error('❌ Migration/seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
