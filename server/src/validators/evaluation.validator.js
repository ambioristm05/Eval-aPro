import { z } from 'zod';
import { EVALUATION_STATUSES } from '../constants/evaluation.constants.js';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id invalido');

const answerSchema = z.object({
  criterion: mongoIdSchema.optional(),
  indicator: mongoIdSchema.optional(),
  levelName: z.string().trim().max(100).optional(),
  value: z.any().optional(),
  score: z.coerce.number().min(0).default(0),
  observation: z.string().trim().max(500).default('')
});

const suggestionsSchema = z.array(z.string().trim().min(1).max(300)).default([]);

export const createEvaluationSchema = z.object({
  body: z.object({
    student: mongoIdSchema,
    task: mongoIdSchema,
    answers: z.array(answerSchema).default([]),
    feedback: z.string().trim().max(2000).default(''),
    suggestions: suggestionsSchema,
    status: z
      .enum([EVALUATION_STATUSES.DRAFT, EVALUATION_STATUSES.COMPLETED])
      .default(EVALUATION_STATUSES.DRAFT)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listEvaluationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    studentId: mongoIdSchema.optional(),
    taskId: mongoIdSchema.optional(),
    status: z.enum(Object.values(EVALUATION_STATUSES)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const evaluationIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const studentEvaluationsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    studentId: mongoIdSchema
  }),
  query: z.object({
    status: z.enum(Object.values(EVALUATION_STATUSES)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const updateEvaluationSchema = z.object({
  body: z
    .object({
      answers: z.array(answerSchema).optional(),
      feedback: z.string().trim().max(2000).optional(),
      suggestions: z.array(z.string().trim().min(1).max(300)).optional(),
      status: z.enum(Object.values(EVALUATION_STATUSES)).optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar'
    }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});
