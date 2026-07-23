import { z } from 'zod';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id inválido');

export const invitationIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const createEvaluatorInvitationSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Email inválido').toLowerCase(),
    expiresInDays: z.coerce.number().int().min(1).max(30).default(7)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const validateInvitationSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    token: z.string().min(32, 'Token inválido')
  }),
  query: z.object({}).optional()
});
