// Mongoose documents serialize with both `_id` and a virtual `id` getter,
// and some call sites already have a plain id string in hand — this covers all three.
export function getId(resource, fallback = '') {
  if (typeof resource === 'string') return resource;
  return resource?.id ?? resource?._id ?? fallback;
}
