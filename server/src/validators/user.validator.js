import { z } from 'zod';
import { USER_STATUSES } from '../constants/user.constants.js';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id invalido');
const passwordSchema = z
  .string()
  .min(8, 'La contrasena debe tener al menos 8 caracteres')
  .max(72, 'La contrasena no puede exceder 72 caracteres');

export const createStudentSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    email: z.string().trim().email('Email invalido').toLowerCase(),
    password: passwordSchema,
    group: mongoIdSchema.optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listStudentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(Object.values(USER_STATUSES)).optional(),
    groupId: mongoIdSchema.optional(),
    availableForGroup: mongoIdSchema.optional(),
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

export const updateMyProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .optional(),
      email: z.string().trim().email('Email invalido').toLowerCase().optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar'
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const changeMyPasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'La contrasena actual es requerida'),
    newPassword: passwordSchema
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
