import { z } from 'zod';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id inválido');

export const listMessageContactsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const messageThreadSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    userId: mongoIdSchema,
  }),
  query: z.object({}).optional(),
});

export const createMessageSchema = z.object({
  body: z.object({
    recipientId: mongoIdSchema,
    body: z
      .string()
      .trim()
      .min(1, 'El mensaje no puede estar vacío')
      .max(1500, 'El mensaje no puede exceder 1500 caracteres'),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
