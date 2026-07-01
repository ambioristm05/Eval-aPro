import { AuditLog } from '../models/AuditLog.js';

export async function writeAudit({ actor, action, entity, entityId, before = null, after = null, metadata = {} }) {
  return AuditLog.create({
    actor,
    action,
    entity,
    entityId,
    before,
    after,
    metadata
  });
}
