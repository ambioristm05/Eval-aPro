import { z } from 'zod';
import { GROUP_STATUSES } from '../constants/group.constants.js';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id inválido');

export const createGroupSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    description: z.string().trim().max(500, 'La descripción no puede exceder 500 caracteres').default('')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listGroupsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(Object.values(GROUP_STATUSES)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const groupIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const updateGroupSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .optional(),
      description: z.string().trim().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
      status: z.enum(Object.values(GROUP_STATUSES)).optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar'
    }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const addStudentToGroupSchema = z.object({
  body: z.object({
    studentId: mongoIdSchema
  }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const removeStudentFromGroupSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: mongoIdSchema,
    studentId: mongoIdSchema
  }),
  query: z.object({}).optional()
});
