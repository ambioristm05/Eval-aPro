import { z } from 'zod';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id invalido');

export const listMyResultsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    taskId: mongoIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const studentResultsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    studentId: mongoIdSchema
  }),
  query: z.object({
    taskId: mongoIdSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const resultIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const finalGradeSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const studentFinalGradeSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    studentId: mongoIdSchema
  }),
  query: z.object({}).optional()
});
