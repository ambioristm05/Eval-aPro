import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'La contrasena debe tener al menos 8 caracteres')
  .max(72, 'La contrasena no puede exceder 72 caracteres');

export const registerStudentSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    email: z.string().trim().email('Email invalido').toLowerCase(),
    password: passwordSchema
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const registerEvaluatorInvitationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    email: z.string().trim().email('Email invalido').toLowerCase(),
    password: passwordSchema,
    token: z.string().min(32, 'Token invalido')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Email invalido').toLowerCase(),
    password: z.string().min(1, 'La contrasena es requerida')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
