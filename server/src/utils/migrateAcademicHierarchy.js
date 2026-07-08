import { ACADEMIC_STATUSES } from '../constants/academicHierarchy.constants.js';
import { Class as AcademicClass } from '../models/Class.js';
import { Course } from '../models/Course.js';
import { Module as AcademicModule } from '../models/Module.js';
import { Task } from '../models/Task.js';

const DEFAULT_NAMES = Object.freeze({
  course: 'Curso general',
  module: 'Módulo general',
  class: 'Clase general'
});

async function findOrCreateCourse(evaluatorId, names) {
  const course = await Course.findOne({
    evaluator: evaluatorId,
    name: names.course
  });

  if (course) return course;

  return Course.create({
    name: names.course,
    evaluator: evaluatorId,
    status: ACADEMIC_STATUSES.ACTIVE
  });
}

async function findOrCreateModule(evaluatorId, course, names) {
  const module = await AcademicModule.findOne({
    evaluator: evaluatorId,
    course: course._id,
    name: names.module
  });

  if (module) return module;

  return AcademicModule.create({
    name: names.module,
    evaluator: evaluatorId,
    course: course._id,
    order: 0,
    status: ACADEMIC_STATUSES.ACTIVE
  });
}

async function findOrCreateClass(evaluatorId, course, module, names) {
  const academicClass = await AcademicClass.findOne({
    evaluator: evaluatorId,
    course: course._id,
    module: module._id,
    name: names.class
  });

  if (academicClass) return academicClass;

  return AcademicClass.create({
    name: names.class,
    evaluator: evaluatorId,
    course: course._id,
    module: module._id,
    order: 0,
    status: ACADEMIC_STATUSES.ACTIVE
  });
}

export async function migrateAcademicHierarchy(options = {}) {
  const names = { ...DEFAULT_NAMES, ...options.names };
  const orphanFilter = {
    $or: [{ class: { $exists: false } }, { class: null }]
  };
  const evaluatorIds = await Task.find(orphanFilter).distinct('evaluator');
  const summary = {
    evaluators: evaluatorIds.length,
    tasksUpdated: 0,
    items: []
  };

  for (const evaluatorId of evaluatorIds) {
    const course = await findOrCreateCourse(evaluatorId, names);
    const module = await findOrCreateModule(evaluatorId, course, names);
    const academicClass = await findOrCreateClass(evaluatorId, course, module, names);
    const updateResult = await Task.updateMany(
      {
        evaluator: evaluatorId,
        ...orphanFilter
      },
      {
        $set: { class: academicClass._id }
      }
    );
    const updated = updateResult.modifiedCount ?? updateResult.nModified ?? 0;

    summary.tasksUpdated += updated;
    summary.items.push({
      evaluator: evaluatorId.toString(),
      course: course._id.toString(),
      module: module._id.toString(),
      class: academicClass._id.toString(),
      tasksUpdated: updated
    });
  }

  return summary;
}
