import { z } from 'zod';

export const roleSchema = z.enum(['ADMIN', 'READER', 'WRITER']);

export type Role = z.infer<typeof roleSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: roleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const getUsersByRoleInputSchema = z.object({
  role: roleSchema,
});

export type GetUsersByRoleInput = z.infer<typeof getUsersByRoleInputSchema>;

export type GetUsersByRoleOutput = User[];
