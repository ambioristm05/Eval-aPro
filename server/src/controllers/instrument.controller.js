import { INSTRUMENT_STATUSES, INSTRUMENT_TYPES } from '../constants/instrument.constants.js';
import { USER_ROLES } from '../constants/user.constants.js';
import { Instrument } from '../models/Instrument.js';
import { Task } from '../models/Task.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAudit } from '../utils/audit.js';

function instrumentScope(req) {
  if (req.user.role === USER_ROLES.ADMIN) return {};
  return { evaluator: req.user._id };
}

async function findInstrumentForUser(req, id) {
  const instrument = await Instrument.findOne({
    _id: id,
    ...instrumentScope(req)
  }).populate('evaluator', 'name email role');

  if (!instrument) {
    throw new AppError('Instrumento no encontrado', 404);
  }

  return instrument;
}

function hasValidStructure(instrument) {
  if (instrument.type === INSTRUMENT_TYPES.CHECKLIST) return instrument.indicators.length > 0;
  if ([INSTRUMENT_TYPES.RUBRIC, INSTRUMENT_TYPES.RATING_SCALE].includes(instrument.type)) {
    return instrument.criteria.length > 0;
  }
  return instrument.criteria.length > 0 || instrument.indicators.length > 0;
}

export async function ensureInstrumentForEvaluator({ instrumentId, evaluatorId, allowDraft = true }) {
  if (!instrumentId) return null;

  const statusFilter = allowDraft
    ? { $in: Object.values(INSTRUMENT_STATUSES) }
    : INSTRUMENT_STATUSES.ACTIVE;

  const instrument = await Instrument.findOne({
    _id: instrumentId,
    evaluator: evaluatorId,
    status: statusFilter
  });

  if (!instrument) {
    throw new AppError('Instrumento no encontrado o no disponible para esta tarea', 404);
  }

  return instrument;
}

export const createInstrument = asyncHandler(async (req, res) => {
  const { title, description, type, criteria, indicators, options, status } = req.validated.body;

  const instrument = await Instrument.create({
    title,
    description,
    type,
    criteria,
    indicators,
    options,
    evaluator: req.user._id,
    status
  });

  res.status(201).json({ instrument });
});

export const getInstruments = asyncHandler(async (req, res) => {
  const { search, status, type, page, limit } = req.validated.query;
  const filter = {
    ...instrumentScope(req)
  };

  if (status) filter.status = status;
  if (type) filter.type = type;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [instruments, total] = await Promise.all([
    Instrument.find(filter)
      .populate('evaluator', 'name email role')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Instrument.countDocuments(filter)
  ]);

  res.json({
    instruments,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  });
});

export const getInstrumentById = asyncHandler(async (req, res) => {
  const instrument = await findInstrumentForUser(req, req.validated.params.id);

  res.json({ instrument });
});

export const updateInstrument = asyncHandler(async (req, res) => {
  const instrument = await findInstrumentForUser(req, req.validated.params.id);
  const { title, description, type, criteria, indicators, options, status } = req.validated.body;

  if (title !== undefined) instrument.title = title;
  if (description !== undefined) instrument.description = description;
  if (type !== undefined) instrument.type = type;
  if (criteria !== undefined) instrument.criteria = criteria;
  if (indicators !== undefined) instrument.indicators = indicators;
  if (options !== undefined) instrument.options = options;
  if (status !== undefined) instrument.status = status;

  if (!hasValidStructure(instrument)) {
    throw new AppError('El instrumento necesita criterios o indicadores válidos para su tipo', 400);
  }

  await instrument.save();

  res.json({ instrument });
});

export const deleteInstrument = asyncHandler(async (req, res) => {
  const instrument = await findInstrumentForUser(req, req.validated.params.id);

  instrument.status = INSTRUMENT_STATUSES.DELETED;
  await instrument.save();

  res.json({
    message: 'Instrumento eliminado correctamente',
    instrument
  });
});

export const deleteInstrumentPermanent = asyncHandler(async (req, res) => {
  const instrument = await findInstrumentForUser(req, req.validated.params.id);

  if (![INSTRUMENT_STATUSES.ARCHIVED, INSTRUMENT_STATUSES.DELETED].includes(instrument.status)) {
    throw new AppError('Solo puedes eliminar definitivamente instrumentos archivados o eliminados', 400);
  }

  const linkedTasks = await Task.countDocuments({ instrument: instrument._id });
  if (linkedTasks > 0) {
    throw new AppError(
      'Este instrumento está vinculado a tareas existentes. Quita la asignación antes de eliminarlo definitivamente.',
      409
    );
  }

  await Instrument.deleteOne({ _id: instrument._id });

  await writeAudit({
    actor: req.user._id,
    action: 'instrument.permanentDelete',
    entity: 'Instrument',
    entityId: instrument._id,
    before: instrument.toObject(),
    after: null
  });

  res.json({
    message: 'Instrumento eliminado de forma definitiva'
  });
});
