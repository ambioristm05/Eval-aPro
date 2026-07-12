import { SystemConfig } from '../models/SystemConfig.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function getOrCreateConfig() {
  let config = await SystemConfig.findOne({ key: 'system' });
  if (!config) config = await SystemConfig.create({ key: 'system' });
  return config;
}

export const getSettings = asyncHandler(async (req, res) => {
  const config = await getOrCreateConfig();
  res.json({ settings: config });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const allowed = [
    'institutionName',
    'evaluatorRegistrationOpen',
    'invitationExpiryDays',
    'minPassingGrade',
    'studentPrintDefault',
  ];

  const updates = Object.fromEntries(
    Object.entries(req.validated.body).filter(([key]) => allowed.includes(key))
  );

  const config = await SystemConfig.findOneAndUpdate(
    { key: 'system' },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({ settings: config, message: 'Configuración guardada.' });
});
