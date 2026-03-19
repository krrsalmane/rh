import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

export const CreateUserSchema = z.object({
  email: z.string().email('Format email invalide').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(passwordRegex, 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial'),
  role: z.enum(['super_admin', 'hr_agent', 'manager', 'employee']),
  employeeId: z.string().uuid().optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().toLowerCase().trim().optional(),
  role: z.enum(['super_admin', 'hr_agent', 'manager', 'employee']).optional(),
  isActive: z.boolean().optional(),
  employeeId: z.string().uuid().nullable().optional(),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
    newPassword: z
      .string()
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
      .regex(passwordRegex, 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial'),
    confirmPassword: z.string().min(1, 'La confirmation est requise'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
