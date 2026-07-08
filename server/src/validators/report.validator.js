import { z } from 'zod';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id inválido');
const hierarchyQuerySchema = z.object({
  courseId: mongoIdSchema.optional(),
  moduleId: mongoIdSchema.optional(),
  classId: mongoIdSchema.optional()
});

export const studentReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    studentId: mongoIdSchema
  }),
  query: hierarchyQuerySchema.optional()
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
  query: hierarchyQuerySchema.optional()
});

export const taskReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    taskId: mongoIdSchema
  }),
  query: hierarchyQuerySchema.optional()
});

export const instrumentReportSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    instrumentId: mongoIdSchema
  }),
  query: hierarchyQuerySchema.optional()
});
