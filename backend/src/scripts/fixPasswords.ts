import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const hash = await bcrypt.hash('Admin@1234', 12);
  await pool.query('UPDATE users SET password_hash = $1', [hash]);
  const users = await pool.query('SELECT email, role FROM users ORDER BY role');
  console.table(users.rows);
  console.log('✅ All passwords updated to Admin@1234');
  await pool.end();
}

fix().catch(console.error);
