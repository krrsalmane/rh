import { query } from '../config/database';
import bcrypt from 'bcryptjs';

async function test() {
  try {
    const result = await query('SELECT email, password_hash, role FROM users WHERE email = $1', ['admin@hrms.com']);
    console.log('User found:', result.rows[0]);
    if (result.rows[0]) {
      const match = await bcrypt.compare('Admin@1234', (result.rows[0] as any).password_hash);
      console.log('Password match:', match);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

test();
