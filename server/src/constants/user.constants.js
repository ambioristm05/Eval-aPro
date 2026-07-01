export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  EVALUATOR: 'evaluator',
  STUDENT: 'student'
});

export const USER_STATUSES = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
  PENDING: 'pending'
});

export const BLOCKED_USER_STATUSES = Object.freeze([
  USER_STATUSES.SUSPENDED,
  USER_STATUSES.DELETED
]);
