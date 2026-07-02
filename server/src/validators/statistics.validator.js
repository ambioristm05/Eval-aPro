import { z } from 'zod';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id inválido');

export const overviewStatisticsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const groupStatisticsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    groupId: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const taskStatisticsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    taskId: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const instrumentStatisticsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    instrumentId: mongoIdSchema
  }),
  query: z.object({}).optional()
});
