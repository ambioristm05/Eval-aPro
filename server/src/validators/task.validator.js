import { z } from 'zod';
import { TASK_STATUSES } from '../constants/task.constants.js';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id invalido');
const optionalDateSchema = z.coerce.date().optional();

function validateDateRange(data) {
  if (!data.startDate || !data.dueDate) return true;
  return data.dueDate >= data.startDate;
}

const taskBodyShape = {
  title: z
    .string()
    .trim()
    .min(2, 'El titulo debe tener al menos 2 caracteres')
    .max(150, 'El titulo no puede exceder 150 caracteres'),
  description: z.string().trim().max(1000, 'La descripcion no puede exceder 1000 caracteres').default(''),
  group: mongoIdSchema.optional(),
  students: z.array(mongoIdSchema).default([]),
  instrument: mongoIdSchema.optional(),
  status: z.enum(Object.values(TASK_STATUSES)).default(TASK_STATUSES.PENDING),
  startDate: optionalDateSchema,
  dueDate: optionalDateSchema,
  weight: z.coerce.number().min(0).max(100).default(0)
};

export const createTaskSchema = z.object({
  body: z.object(taskBodyShape).refine(validateDateRange, {
    message: 'La fecha de entrega debe ser posterior o igual a la fecha de inicio',
    path: ['dueDate']
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listTasksSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(Object.values(TASK_STATUSES)).optional(),
    groupId: mongoIdSchema.optional(),
    studentId: mongoIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const taskIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const updateTaskSchema = z.object({
  body: z
    .object({
      title: taskBodyShape.title.optional(),
      description: z.string().trim().max(1000, 'La descripcion no puede exceder 1000 caracteres').optional(),
      status: z.enum(Object.values(TASK_STATUSES)).optional(),
      group: mongoIdSchema.optional(),
      students: z.array(mongoIdSchema).optional(),
      instrument: mongoIdSchema.optional(),
      startDate: optionalDateSchema,
      dueDate: optionalDateSchema,
      weight: z.coerce.number().min(0).max(100).optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar'
    })
    .refine(validateDateRange, {
      message: 'La fecha de entrega debe ser posterior o igual a la fecha de inicio',
      path: ['dueDate']
    }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});
