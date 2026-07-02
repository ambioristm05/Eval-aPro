import { z } from 'zod';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id invalido');

export const studentReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    studentId: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const studentReportPermissionSchema = z.object({
  body: z.object({
    enabled: z.coerce.boolean()
  }),
  params: z.object({
    studentId: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const groupReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    groupId: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const taskReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    taskId: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const instrumentReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    instrumentId: mongoIdSchema
  }),
  query: z.object({}).optional()
});
