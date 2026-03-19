import bcrypt from 'bcryptjs';

async function generateHash() {
  const password = 'Admin@1234';
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}

generateHash();
