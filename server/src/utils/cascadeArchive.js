import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';

export async function bulkArchive(model, filter) {
  const result = await model.updateMany(
    { ...filter, status: ACADEMIC_STATUSES.ACTIVE },
    { $set: { status: ACADEMIC_STATUSES.ARCHIVED } }
  );

  return result.modifiedCount ?? 0;
}
