import { z } from 'zod';
import { USER_STATUSES } from '../constants/user.constants.js';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id inválido');
const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede exceder 72 caracteres');
const booleanQuerySchema = z
  .preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  }, z.boolean())
  .optional();

export const createEvaluatorSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    email: z.string().trim().email('Email inválido').toLowerCase(),
    password: passwordSchema,
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const createStudentSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    email: z.string().trim().email('Email inválido').toLowerCase(),
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
    includeDeleted: booleanQuerySchema,
    groupId: mongoIdSchema.optional(),
    availableForGroup: mongoIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const listEvaluatorsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(Object.values(USER_STATUSES)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const deleteUserPermanentSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'La contraseña es requerida'),
    reason: z.string().trim().max(300, 'La razón no puede exceder 300 caracteres').optional()
  }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({ cascade: booleanQuerySchema }).optional()
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
      .min(3, 'La razón debe tener al menos 3 caracteres')
      .max(300, 'La razón no puede exceder 300 caracteres')
  }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const reactivateStudentSchema = z.object({
  body: z.object({
    reason: z.string().trim().max(300, 'La razón no puede exceder 300 caracteres').optional()
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
      .min(3, 'La razón debe tener al menos 3 caracteres')
      .max(300, 'La razón no puede exceder 300 caracteres')
  }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const deleteMyAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'La contraseña es requerida'),
    reason: z.string().trim().max(300, 'La razón no puede exceder 300 caracteres').optional()
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
        .optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar'
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const changeMyPasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
      newPassword: passwordSchema,
      confirmNewPassword: z.string().min(1, 'Confirma la nueva contraseña')
    })
    .refine((body) => body.newPassword === body.confirmNewPassword, {
      message: 'La confirmación no coincide con la nueva contraseña',
      path: ['confirmNewPassword']
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
