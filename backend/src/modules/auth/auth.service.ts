import bcrypt from 'bcryptjs';
import { query } from '../../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from '../../config/jwt';
import { AppError } from '../../shared/utils/AppError';
import { LoginInput } from './auth.schema';

interface UserRow {
  id: string;
  company_id: string;
  email: string;
  password_hash: string;
  role: string;
  employee_id: string | null;
  is_active: boolean;
  refresh_token: string | null;
  created_at: string;
}

export async function login(input: LoginInput) {
  const result = await query<UserRow>('SELECT * FROM users WHERE email = $1', [input.email]);
  const user = result.rows[0];
  if (!user) throw new AppError('Invalid email or password', 401);
  if (!user.is_active) throw new AppError('Account is deactivated', 403);

  const isMatch = await bcrypt.compare(input.password, user.password_hash);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const payload: TokenPayload = { id: user.id, email: user.email, companyId: user.company_id, role: user.role, employeeId: user.employee_id || undefined };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  try {
    await query('UPDATE users SET refresh_token = $1, last_login = NOW() WHERE id = $2', [refreshToken, user.id]);
  } catch (err) {
    console.warn('⚠️ Could not update last_login (column might be missing), but continuing login...');
    await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role as any,
      companyId: user.company_id,
      employeeId: user.employee_id
    }
  };
}

export async function logout(userId: string) {
  await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [userId]);
}

export async function refresh(token: string) {
  const payload = verifyRefreshToken(token);
  const result = await query<UserRow>('SELECT * FROM users WHERE id = $1 AND refresh_token = $2', [payload.id, token]);
  const user = result.rows[0];
  if (!user) throw new AppError('Invalid refresh token', 401);
  if (!user.is_active) throw new AppError('Account is deactivated', 403);

  const newPayload: TokenPayload = { id: user.id, email: user.email, companyId: user.company_id, role: user.role, employeeId: user.employee_id || undefined };
  const accessToken = signAccessToken(newPayload);

  return { 
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role as any,
      companyId: user.company_id,
      employeeId: user.employee_id
    }
  };
}

export async function me(userId: string) {
  const result = await query<Omit<UserRow, 'password_hash' | 'refresh_token'>>(
    'SELECT id, company_id, email, `role`, employee_id, is_active, created_at FROM users WHERE id = $1',
    [userId]
  );
  const user = result.rows[0];
  if (!user) throw new AppError('User not found', 404);
  
  return {
    id: user.id,
    companyId: user.company_id,
    email: user.email,
    role: user.role as any,
    employeeId: user.employee_id,
    isActive: user.is_active,
    createdAt: user.created_at
  };
}






