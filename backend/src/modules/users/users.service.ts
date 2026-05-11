import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import * as usersRepository from './users.repository';
import { CreateUserInput, UpdateUserInput } from './users.schema';
import { AppError } from '../../shared/utils/AppError';
import { auditLog } from '../../shared/utils/auditLogger';

// ── Helpers ────────────────────────────────────────────

function generateTempPassword(): string {
  // 12-char password that meets strength rules
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@$!%*?&';
  const all = upper + lower + digits + special;

  let pw = '';
  pw += upper[crypto.randomInt(upper.length)];
  pw += lower[crypto.randomInt(lower.length)];
  pw += digits[crypto.randomInt(digits.length)];
  pw += special[crypto.randomInt(special.length)];
  for (let i = 4; i < 12; i++) {
    pw += all[crypto.randomInt(all.length)];
  }
  // Shuffle
  return pw
    .split('')
    .sort(() => crypto.randomInt(3) - 1)
    .join('');
}

function sanitizeUser(user: usersRepository.UserRow) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    employeeId: user.employee_id,
    employeeName: user.employee_name,
    department: user.department,
    function: user.function,
    createdAt: user.created_at,
    // lastLogin: user.last_login,
    // mustChangePassword: user.must_change_password,
  };
}

// ── Service Methods ────────────────────────────────────

export async function getUsers(
  companyId: string,
  filters: { search?: string; role?: string; isActive?: string },
  page: number = 1,
  limit: number = 20
) {
  const result = await usersRepository.findAll(companyId, filters, page, limit);
  return {
    items: result.items.map(sanitizeUser),
    pagination: result.pagination,
  };
}

export async function getUserById(id: string, companyId: string) {
  const user = await usersRepository.findById(id, companyId);
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  return sanitizeUser(user);
}

export async function createUser(input: CreateUserInput, companyId: string, actorId: string) {
  // Check duplicate email
  const existing = await usersRepository.findByEmail(input.email, companyId);
  if (existing) throw new AppError('Un utilisateur avec cet email existe déjà', 409);

  const user = await usersRepository.create(input, companyId);

  await auditLog({
    userId: actorId,
    companyId,
    action: 'CREATE',
    entity: 'user',
    entityId: user.id,
    newValue: { email: input.email, role: input.role },
  });

  return sanitizeUser(user);
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  companyId: string,
  actorId: string
) {
  // Cannot change own role
  if (id === actorId && input.role !== undefined) {
    throw new AppError('Vous ne pouvez pas modifier votre propre rôle', 400);
  }
  // Cannot deactivate own account
  if (id === actorId && input.isActive === false) {
    throw new AppError('Vous ne pouvez pas désactiver votre propre compte', 400);
  }

  const existing = await usersRepository.findById(id, companyId);
  if (!existing) throw new AppError('Utilisateur introuvable', 404);

  // Check email uniqueness if changing
  if (input.email && input.email !== existing.email) {
    const dup = await usersRepository.findByEmail(input.email, companyId);
    if (dup) throw new AppError('Un utilisateur avec cet email existe déjà', 409);
  }

  const updated = await usersRepository.update(id, input, companyId);

  await auditLog({
    userId: actorId,
    companyId,
    action: 'UPDATE',
    entity: 'user',
    entityId: id,
    oldValue: { email: existing.email, role: existing.role, isActive: existing.is_active },
    newValue: input as unknown as Record<string, unknown>,
  });

  return sanitizeUser(updated!);
}

export async function deactivateUser(id: string, companyId: string, actorId: string) {
  if (id === actorId) throw new AppError('Vous ne pouvez pas désactiver votre propre compte', 400);

  const existing = await usersRepository.findById(id, companyId);
  if (!existing) throw new AppError('Utilisateur introuvable', 404);

  const updated = await usersRepository.deactivate(id, companyId);

  await auditLog({
    userId: actorId,
    companyId,
    action: 'DEACTIVATE',
    entity: 'user',
    entityId: id,
    newValue: { isActive: false },
  });

  return sanitizeUser(updated!);
}

export async function reactivateUser(id: string, companyId: string, actorId: string) {
  const existing = await usersRepository.findById(id, companyId);
  if (!existing) throw new AppError('Utilisateur introuvable', 404);

  const updated = await usersRepository.reactivate(id, companyId);

  await auditLog({
    userId: actorId,
    companyId,
    action: 'REACTIVATE',
    entity: 'user',
    entityId: id,
    newValue: { isActive: true },
  });

  return sanitizeUser(updated!);
}

export async function resetPassword(id: string, companyId: string, actorId: string) {
  const existing = await usersRepository.findById(id, companyId);
  if (!existing) throw new AppError('Utilisateur introuvable', 404);

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 12);

  await usersRepository.updatePassword(id, companyId, hash, true);

  await auditLog({
    userId: actorId,
    companyId,
    action: 'RESET_PASSWORD',
    entity: 'user',
    entityId: id,
    newValue: { mustChangePassword: true },
  });

  return { temporaryPassword: tempPassword };
}

export async function deleteUser(id: string, companyId: string, actorId: string) {
  if (id === actorId) throw new AppError('Vous ne pouvez pas supprimer votre propre compte', 400);

  const existing = await usersRepository.findById(id, companyId);
  if (!existing) throw new AppError('Utilisateur introuvable', 404);

  // Cannot delete last super_admin
  if (existing.role === 'super_admin') {
    const count = await usersRepository.countByRole(companyId, 'super_admin');
    if (count <= 1) throw new AppError('Impossible de supprimer le dernier super administrateur', 400);
  }

  await usersRepository.remove(id, companyId);

  await auditLog({
    userId: actorId,
    companyId,
    action: 'DELETE',
    entity: 'user',
    entityId: id,
    oldValue: { email: existing.email, role: existing.role },
  });
}
