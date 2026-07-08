import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña no puede exceder 72 caracteres');

export const registerStudentSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    email: z.string().trim().email('Email inválido').toLowerCase(),
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
    email: z.string().trim().email('Email inválido').toLowerCase(),
    password: passwordSchema,
    token: z.string().min(32, 'Token inválido')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Email inválido').toLowerCase(),
    password: z.string().min(1, 'La contraseña es requerida')
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Email inválido').toLowerCase()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(32, 'Token inválido'),
      password: passwordSchema,
      confirmPassword: z.string().min(1, 'Confirma la nueva contraseña')
    })
    .refine((body) => body.password === body.confirmPassword, {
      message: 'La confirmación no coincide con la nueva contraseña',
      path: ['confirmPassword']
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
