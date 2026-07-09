import { z } from 'zod';
import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id inválido');

const booleanQuerySchema = z
  .preprocess((value) => {
    if (value === undefined) return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  }, z.boolean())
  .optional()
  .default(false);

const baseBodyShape = {
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(150),
  description: z.string().trim().max(1000).default(''),
  status: z.enum(Object.values(ACADEMIC_STATUSES)).default(ACADEMIC_STATUSES.ACTIVE)
};

const updateBodyShape = {
  name: baseBodyShape.name.optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(Object.values(ACADEMIC_STATUSES)).optional()
};

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(Object.values(ACADEMIC_STATUSES)).optional(),
  evaluatorId: mongoIdSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const createCourseSchema = z.object({
  body: z.object(baseBodyShape),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listCoursesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: listQuerySchema
});

export const courseIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: mongoIdSchema }),
  query: z.object({ cascade: booleanQuerySchema }).optional()
});

export const updateCourseSchema = z.object({
  body: z.object(updateBodyShape).refine((body) => Object.keys(body).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar'
  }),
  params: z.object({ id: mongoIdSchema }),
  query: z.object({}).optional()
});

export const courseModulesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ courseId: mongoIdSchema }),
  query: listQuerySchema
});

export const createModuleSchema = z.object({
  body: z.object({
    ...baseBodyShape,
    order: z.coerce.number().int().min(0).default(0)
  }),
  params: z.object({ courseId: mongoIdSchema }),
  query: z.object({}).optional()
});

export const moduleIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: mongoIdSchema }),
  query: z.object({ cascade: booleanQuerySchema }).optional()
});

export const updateModuleSchema = z.object({
  body: z
    .object({
      ...updateBodyShape,
      order: z.coerce.number().int().min(0).optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar'
    }),
  params: z.object({ id: mongoIdSchema }),
  query: z.object({}).optional()
});

export const moduleClassesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ moduleId: mongoIdSchema }),
  query: listQuerySchema
});

export const createClassSchema = z.object({
  body: z.object({
    ...baseBodyShape,
    order: z.coerce.number().int().min(0).default(0)
  }),
  params: z.object({ moduleId: mongoIdSchema }),
  query: z.object({}).optional()
});

export const classIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: mongoIdSchema }),
  query: z.object({ cascade: booleanQuerySchema }).optional()
});

export const updateClassSchema = z.object({
  body: z
    .object({
      ...updateBodyShape,
      order: z.coerce.number().int().min(0).optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar'
    }),
  params: z.object({ id: mongoIdSchema }),
  query: z.object({}).optional()
});
