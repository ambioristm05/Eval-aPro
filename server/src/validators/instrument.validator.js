import { z } from 'zod';
import { INSTRUMENT_STATUSES, INSTRUMENT_TYPES } from '../constants/instrument.constants.js';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Id inválido');

const levelSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del nivel es requerido').max(80),
  description: z.string().trim().max(500).default(''),
  score: z.coerce.number().min(0)
});

const criterionSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del criterio es requerido').max(120),
  description: z.string().trim().max(500).default(''),
  maxScore: z.coerce.number().min(0),
  levels: z.array(levelSchema).default([])
});

const indicatorSchema = z.object({
  text: z.string().trim().min(1, 'El indicador es requerido').max(300),
  score: z.coerce.number().min(0).default(0)
});

function validateInstrumentStructure(data) {
  if (data.type === INSTRUMENT_TYPES.CHECKLIST) return data.indicators?.length > 0;
  if ([INSTRUMENT_TYPES.RUBRIC, INSTRUMENT_TYPES.RATING_SCALE].includes(data.type)) return data.criteria?.length > 0;
  return (data.criteria?.length || 0) > 0 || (data.indicators?.length || 0) > 0;
}

export const createInstrumentSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(2, 'El título debe tener al menos 2 caracteres')
        .max(150, 'El título no puede exceder 150 caracteres'),
      description: z.string().trim().max(1000, 'La descripción no puede exceder 1000 caracteres').default(''),
      type: z.enum(Object.values(INSTRUMENT_TYPES)),
      criteria: z.array(criterionSchema).default([]),
      indicators: z.array(indicatorSchema).default([]),
      status: z.enum(Object.values(INSTRUMENT_STATUSES)).default(INSTRUMENT_STATUSES.DRAFT)
    })
    .refine(validateInstrumentStructure, {
      message: 'El instrumento necesita criterios o indicadores válidos para su tipo'
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listInstrumentsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(Object.values(INSTRUMENT_STATUSES)).optional(),
    type: z.enum(Object.values(INSTRUMENT_TYPES)).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  })
});

export const instrumentIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});

export const updateInstrumentSchema = z.object({
  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(2, 'El título debe tener al menos 2 caracteres')
        .max(150, 'El título no puede exceder 150 caracteres')
        .optional(),
      description: z.string().trim().max(1000, 'La descripción no puede exceder 1000 caracteres').optional(),
      type: z.enum(Object.values(INSTRUMENT_TYPES)).optional(),
      criteria: z.array(criterionSchema).optional(),
      indicators: z.array(indicatorSchema).optional(),
      status: z.enum(Object.values(INSTRUMENT_STATUSES)).optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'Debes enviar al menos un campo para actualizar'
    }),
  params: z.object({
    id: mongoIdSchema
  }),
  query: z.object({}).optional()
});
