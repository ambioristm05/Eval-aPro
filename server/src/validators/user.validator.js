import { z } from 'zod';
import { USER_STATUSES } from '../constants/user.constants.js';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id invalido');

export const listStudentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(Object.values(USER_STATUSES)).optional(),
    groupId: mongoIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const studentIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const suspendStudentSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .trim()
      .min(3, 'La razon debe tener al menos 3 caracteres')
      .max(300, 'La razon no puede exceder 300 caracteres')
  }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const reactivateStudentSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(300, 'La razon no puede exceder 300 caracteres').optional()
  }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const deleteStudentSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .trim()
      .min(3, 'La razon debe tener al menos 3 caracteres')
      .max(300, 'La razon no puede exceder 300 caracteres')
  }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const deleteMyAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'La contrasena es requerida'),
    reason: z.string().trim().max(300, 'La razon no puede exceder 300 caracteres').optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
