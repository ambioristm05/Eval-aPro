import { AuditLog } from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.entity) filter.entity = req.query.entity;
  if (req.query.actor) filter.actor = req.query.actor;
  if (req.query.action) filter.action = { $regex: req.query.action, $options: 'i' };

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name email role'),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getAuditEntities = asyncHandler(async (_req, res) => {
  const entities = await AuditLog.distinct('entity');
  res.json({ entities: entities.sort() });
});
