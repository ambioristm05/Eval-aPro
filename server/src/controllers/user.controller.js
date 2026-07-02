import { USER_ROLES, USER_STATUSES } from '../constants/user.constants.js';
import { Group } from '../models/Group.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function getEvaluatorGroupIds(evaluatorId) {
  return Group.find({ evaluator: evaluatorId }).distinct('_id');
}

async function buildStudentFilter(req) {
  const { availableForGroup, groupId, search, status } = req.validated.query;
  const filter = {
    role: USER_ROLES.STUDENT
  };

  if (status) {
    filter.status = status;
  } else {
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
    filter.groups = { $ne: availableForGroup };
    return filter;
  }

  if (!evaluatorGroupIds.length) {
    filter._id = { $in: [] };
    return filter;
  }

  if (groupId) {
    const ownsGroup = evaluatorGroupIds.some((id) => id.equals(groupId));
    if (!ownsGroup) throw new AppError('Grupo no encontrado', 404);
    filter.groups = groupId;
    return filter;
  }

  filter.groups = { $in: evaluatorGroupIds };
  return filter;
}

async function findManageableStudent(req, id) {
  const filter = {
    _id: id,
    role: USER_ROLES.STUDENT
  };

  if (req.user.role === USER_ROLES.EVALUATOR) {
    const evaluatorGroupIds = await getEvaluatorGroupIds(req.user._id);
    filter.groups = { $in: evaluatorGroupIds };
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

  if (req.user.role === USER_ROLES.EVALUATOR && !group) {
    throw new AppError('Debes seleccionar un grupo para crear estudiantes', 400);
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

export const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const filter = {
    _id: id,
    role: USER_ROLES.STUDENT
  };
  const groupPopulateMatch = req.user.role === USER_ROLES.EVALUATOR ? { evaluator: req.user._id } : {};

  if (req.user.role === USER_ROLES.EVALUATOR) {
    const evaluatorGroupIds = await getEvaluatorGroupIds(req.user._id);
    filter.groups = { $in: evaluatorGroupIds };
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

  if (student.status === USER_STATUSES.DELETED) {
    throw new AppError('No puedes suspender un estudiante eliminado', 409);
  }

  student.status = USER_STATUSES.SUSPENDED;
  student.suspendedAt = new Date();
  student.statusReason = reason;
  student.actionBy = req.user._id;

  await student.save();

  res.json({ student });
});

export const reactivateStudent = asyncHandler(async (req, res) => {
  const student = await findManageableStudent(req, req.validated.params.id);
  const { reason } = req.validated.body;

  student.status = USER_STATUSES.ACTIVE;
  student.suspendedAt = undefined;
  student.deletedAt = undefined;
  student.statusReason = reason || '';
  student.actionBy = req.user._id;

  await student.save();

  res.json({ student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await findManageableStudent(req, req.validated.params.id);
  const { reason } = req.validated.body;

  student.status = USER_STATUSES.DELETED;
  student.deletedAt = new Date();
  student.statusReason = reason;
  student.actionBy = req.user._id;

  await student.save();

  res.json({
    message: 'Estudiante eliminado logicamente',
    student
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
  const passwordMatches = await req.user.comparePassword(currentPassword);

  if (!passwordMatches) {
    throw new AppError('Contrasena actual incorrecta', 401);
  }

  req.user.password = newPassword;
  await req.user.save();

  res.json({
    message: 'Contrasena actualizada correctamente'
  });
});

export const deleteMyAccount = asyncHandler(async (req, res) => {
  const { password, reason } = req.validated.body;

  if (req.user.role !== USER_ROLES.STUDENT) {
    throw new AppError('Solo los estudiantes pueden eliminar su propia cuenta desde este endpoint', 403);
  }

  const passwordMatches = await req.user.comparePassword(password);
  if (!passwordMatches) {
    throw new AppError('Contrasena incorrecta', 401);
  }

  req.user.status = USER_STATUSES.DELETED;
  req.user.deletedAt = new Date();
  req.user.statusReason = reason || 'Cuenta eliminada por el estudiante';
  req.user.actionBy = req.user._id;

  await req.user.save();

  res.json({
    message: 'Cuenta eliminada logicamente. Cierra la sesion localmente para completar el proceso.'
  });
});
