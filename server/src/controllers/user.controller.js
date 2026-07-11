import { USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Course } from '../models/Course.js';
import { Group } from '../models/Group.js';
import { Module as AcademicModule } from '../models/Module.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAudit } from '../utils/audit.js';

async function getEvaluatorGroupIds(evaluatorId) {
  return Group.find({ evaluator: evaluatorId }).distinct('_id');
}

function buildEvaluatorStudentOwnershipFilter(evaluatorId, evaluatorGroupIds) {
  const ownershipFilters = [{ createdBy: evaluatorId }];

  if (evaluatorGroupIds.length) {
    ownershipFilters.push({ groups: { $in: evaluatorGroupIds } });
  }

  return { $or: ownershipFilters };
}

async function buildStudentFilter(req) {
  const { availableForGroup, groupId, includeDeleted, search, status } = req.validated.query;
  const filter = {
    role: USER_ROLES.STUDENT
  };

  if (status) {
    filter.status = status;
  } else if (!includeDeleted) {
    filter.status = { $ne: USER_STATUSES.DELETED };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (req.user.role === USER_ROLES.ADMIN) {
    if (availableForGroup) {
      filter.status = USER_STATUSES.ACTIVE;
      filter.groups = { $ne: availableForGroup };
      return filter;
    }

    if (groupId) filter.groups = groupId;
    return filter;
  }

  const evaluatorGroupIds = await getEvaluatorGroupIds(req.user._id);

  if (availableForGroup) {
    const ownsGroup = evaluatorGroupIds.some((id) => id.equals(availableForGroup));
    if (!ownsGroup) throw new AppError('Grupo no encontrado', 404);

    filter.status = USER_STATUSES.ACTIVE;
    filter.$and = [
      buildEvaluatorStudentOwnershipFilter(req.user._id, evaluatorGroupIds),
      { groups: { $ne: availableForGroup } }
    ];
    return filter;
  }

  if (groupId) {
    const ownsGroup = evaluatorGroupIds.some((id) => id.equals(groupId));
    if (!ownsGroup) throw new AppError('Grupo no encontrado', 404);
    filter.groups = groupId;
    return filter;
  }

  const ownershipFilter = buildEvaluatorStudentOwnershipFilter(req.user._id, evaluatorGroupIds);
  if (filter.$or) {
    filter.$and = [{ $or: filter.$or }, ownershipFilter];
    delete filter.$or;
  } else {
    Object.assign(filter, ownershipFilter);
  }
  return filter;
}

async function findManageableStudent(req, id) {
  const filter = {
    _id: id,
    role: USER_ROLES.STUDENT
  };

  if (req.user.role === USER_ROLES.EVALUATOR) {
    const evaluatorGroupIds = await getEvaluatorGroupIds(req.user._id);
    Object.assign(filter, buildEvaluatorStudentOwnershipFilter(req.user._id, evaluatorGroupIds));
  }

  const student = await User.findOne(filter);
  if (!student) {
    throw new AppError('Estudiante no encontrado', 404);
  }

  return student;
}

async function getCurrentUserProfile(userId) {
  return User.findById(userId).populate({
    path: 'groups',
    select: 'name status evaluator'
  });
}

async function getCurrentUserWithPassword(userId) {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError('Usuario no encontrado', 401);
  }

  return user;
}

function userStatusAuditSnapshot(user) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    deletedAt: user.deletedAt,
    suspendedAt: user.suspendedAt,
    statusReason: user.statusReason,
    actionBy: user.actionBy
  };
}

export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, password, group: groupId } = req.validated.body;

  const existingUser = await User.exists({ email });
  if (existingUser) {
    throw new AppError('Ya existe una cuenta con este email', 409);
  }

  let group = null;

  if (groupId) {
    const groupFilter = { _id: groupId };
    if (req.user.role === USER_ROLES.EVALUATOR) {
      groupFilter.evaluator = req.user._id;
    }

    group = await Group.findOne(groupFilter);
    if (!group) {
      throw new AppError('Grupo no encontrado', 404);
    }
  }

  const student = await User.create({
    name,
    email,
    password,
    role: USER_ROLES.STUDENT,
    status: USER_STATUSES.ACTIVE,
    groups: group ? [group._id] : [],
    createdBy: req.user._id
  });

  if (group) {
    await Group.findByIdAndUpdate(group._id, {
      $addToSet: { students: student._id }
    });
  }

  const populatedStudent = await User.findById(student._id).populate({
    path: 'groups',
    select: 'name status evaluator'
  });

  res.status(201).json({ student: populatedStudent });
});

export const getStudents = asyncHandler(async (req, res) => {
  const { page, limit } = req.validated.query;
  const filter = await buildStudentFilter(req);
  const skip = (page - 1) * limit;
  const groupPopulateMatch = req.user.role === USER_ROLES.EVALUATOR ? { evaluator: req.user._id } : {};

  const [students, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .populate({
        path: 'groups',
        match: groupPopulateMatch,
        select: 'name status evaluator'
      })
      .sort({ name: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({
    students,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getEvaluators = asyncHandler(async (req, res) => {
  const { search, status, page, limit } = req.validated.query;
  const filter = { role: USER_ROLES.EVALUATOR };

  if (status) filter.status = status;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [evaluators, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ name: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({
    evaluators,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const filter = {
    _id: id,
    role: USER_ROLES.STUDENT
  };
  const groupPopulateMatch = req.user.role === USER_ROLES.EVALUATOR ? { evaluator: req.user._id } : {};

  if (req.user.role === USER_ROLES.EVALUATOR) {
    const evaluatorGroupIds = await getEvaluatorGroupIds(req.user._id);
    Object.assign(filter, buildEvaluatorStudentOwnershipFilter(req.user._id, evaluatorGroupIds));
  }

  const student = await User.findOne(filter).populate({
    path: 'groups',
    match: groupPopulateMatch,
    select: 'name status evaluator'
  });

  if (!student) {
    throw new AppError('Estudiante no encontrado', 404);
  }

  res.json({ student });
});

export const suspendStudent = asyncHandler(async (req, res) => {
  const student = await findManageableStudent(req, req.validated.params.id);
  const { reason } = req.validated.body;
  const before = userStatusAuditSnapshot(student);

  if (student.status === USER_STATUSES.DELETED) {
    throw new AppError('No puedes suspender un estudiante eliminado', 409);
  }

  student.status = USER_STATUSES.SUSPENDED;
  student.suspendedAt = new Date();
  student.statusReason = reason;
  student.actionBy = req.user._id;

  await student.save();
  await writeAudit({
    actor: req.user._id,
    action: 'student.suspend',
    entity: 'User',
    entityId: student._id,
    before,
    after: userStatusAuditSnapshot(student),
    metadata: { reason }
  });

  res.json({ student });
});

export const reactivateStudent = asyncHandler(async (req, res) => {
  const student = await findManageableStudent(req, req.validated.params.id);
  const { reason } = req.validated.body;
  const before = userStatusAuditSnapshot(student);

  student.status = USER_STATUSES.ACTIVE;
  student.suspendedAt = undefined;
  student.deletedAt = undefined;
  student.statusReason = reason || '';
  student.actionBy = req.user._id;

  await student.save();
  await writeAudit({
    actor: req.user._id,
    action: 'student.reactivate',
    entity: 'User',
    entityId: student._id,
    before,
    after: userStatusAuditSnapshot(student),
    metadata: { reason }
  });

  res.json({ student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await findManageableStudent(req, req.validated.params.id);
  const { reason } = req.validated.body;
  const before = userStatusAuditSnapshot(student);

  student.status = USER_STATUSES.DELETED;
  student.deletedAt = new Date();
  student.statusReason = reason;
  student.actionBy = req.user._id;

  await student.save();
  await writeAudit({
    actor: req.user._id,
    action: 'student.delete',
    entity: 'User',
    entityId: student._id,
    before,
    after: userStatusAuditSnapshot(student),
    metadata: { reason }
  });

  res.json({
    message: 'Estudiante eliminado lógicamente',
    student
  });
});

export const deleteUserPermanent = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { password, reason } = req.validated.body;
  const cascade = req.validated.query?.cascade;

  const target = await User.findById(id);
  if (!target) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (target.role === USER_ROLES.ADMIN) {
    throw new AppError('No puedes eliminar cuentas de administrador', 403);
  }

  if (target._id.equals(req.user._id)) {
    throw new AppError('No puedes eliminar tu propia cuenta desde aquí', 403);
  }

  const admin = await getCurrentUserWithPassword(req.user._id);
  const passwordMatches = await admin.comparePassword(password);
  if (!passwordMatches) {
    throw new AppError('Contraseña incorrecta', 401);
  }

  const before = userStatusAuditSnapshot(target);
  const cascadeCounts = {};

  if (target.role === USER_ROLES.EVALUATOR) {
    const classIds = await AcademicClass.find({ evaluator: target._id }).distinct('_id');
    const hasContent =
      classIds.length > 0 ||
      (await Course.exists({ evaluator: target._id })) ||
      (await AcademicModule.exists({ evaluator: target._id }));

    if (hasContent && !cascade) {
      throw new AppError(
        'Este evaluador tiene cursos, módulos, clases o tareas asociadas. Confirma la eliminación en cascada.',
        409
      );
    }

    const [tasksDeleted, classesDeleted, modulesDeleted, coursesDeleted] = await Promise.all([
      Task.deleteMany({ evaluator: target._id }),
      AcademicClass.deleteMany({ evaluator: target._id }),
      AcademicModule.deleteMany({ evaluator: target._id }),
      Course.deleteMany({ evaluator: target._id })
    ]);

    cascadeCounts.courses = coursesDeleted.deletedCount ?? 0;
    cascadeCounts.modules = modulesDeleted.deletedCount ?? 0;
    cascadeCounts.classes = classesDeleted.deletedCount ?? 0;
    cascadeCounts.tasks = tasksDeleted.deletedCount ?? 0;
  }

  if (target.role === USER_ROLES.STUDENT) {
    await Promise.all([
      Group.updateMany({ students: target._id }, { $pull: { students: target._id } }),
      Task.updateMany({ students: target._id }, { $pull: { students: target._id } })
    ]);
  }

  await User.deleteOne({ _id: target._id });

  await writeAudit({
    actor: req.user._id,
    action: 'user.permanentDelete',
    entity: 'User',
    entityId: target._id,
    before,
    after: null,
    metadata: { reason, cascade: cascadeCounts }
  });

  res.json({
    message: 'Cuenta eliminada de forma definitiva',
    cascade: cascadeCounts
  });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await getCurrentUserProfile(req.user._id);

  res.json({ user });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { name } = req.validated.body;

  if (name !== undefined) req.user.name = name;

  await req.user.save();
  const user = await getCurrentUserProfile(req.user._id);

  res.json({ user });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated.body;
  const user = await getCurrentUserWithPassword(req.user._id);
  const passwordMatches = await user.comparePassword(currentPassword);

  if (!passwordMatches) {
    throw new AppError('Contraseña actual incorrecta', 401);
  }

  user.password = newPassword;
  await user.save();

  res.json({
    message: 'Contraseña actualizada correctamente'
  });
});

export const deleteMyAccount = asyncHandler(async (req, res) => {
  const { password, reason } = req.validated.body;

  const allowedSelfDeleteRoles = [USER_ROLES.STUDENT, USER_ROLES.EVALUATOR];
  if (!allowedSelfDeleteRoles.includes(req.user.role)) {
    throw new AppError('Solo estudiantes y evaluadores pueden eliminar su propia cuenta desde este endpoint', 403);
  }

  const user = await getCurrentUserWithPassword(req.user._id);
  const before = userStatusAuditSnapshot(user);
  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    throw new AppError('Contraseña incorrecta', 401);
  }

  user.status = USER_STATUSES.DELETED;
  user.deletedAt = new Date();
  const defaultReason =
    req.user.role === USER_ROLES.EVALUATOR ? 'Cuenta eliminada por el evaluador titular' : 'Cuenta eliminada por el estudiante';
  user.statusReason = reason || defaultReason;
  user.actionBy = user._id;

  await user.save();
  await writeAudit({
    actor: user._id,
    action: 'account.delete',
    entity: 'User',
    entityId: user._id,
    before,
    after: userStatusAuditSnapshot(user),
    metadata: { reason: reason || defaultReason }
  });

  res.json({
    message: 'Cuenta eliminada lógicamente. Cierra la sesión localmente para completar el proceso.'
  });
});
