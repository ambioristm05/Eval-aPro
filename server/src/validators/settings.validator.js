import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    institutionName: z.string().trim().max(120).optional(),
    evaluatorRegistrationOpen: z.boolean().optional(),
    invitationExpiryDays: z.number().int().min(1).max(90).optional(),
    minPassingGrade: z.number().min(0).max(100).optional(),
    studentPrintDefault: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
