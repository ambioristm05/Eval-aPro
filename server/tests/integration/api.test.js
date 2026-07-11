import crypto from 'crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app.js';
import { EVALUATION_STATUSES } from '../../src/constants/evaluation.constants.js';
import { INSTRUMENT_STATUSES, INSTRUMENT_TYPES } from '../../src/constants/instrument.constants.js';
import { TASK_STATUSES } from '../../src/constants/task.constants.js';
import { USER_ROLES, USER_STATUSES } from '../../src/constants/user.constants.js';
import { Class as AcademicClass } from '../../src/models/Class.js';
import { Course } from '../../src/models/Course.js';
import { Evaluation } from '../../src/models/Evaluation.js';
import { Group } from '../../src/models/Group.js';
import { Instrument } from '../../src/models/Instrument.js';
import { Module as AcademicModule } from '../../src/models/Module.js';
import { Task } from '../../src/models/Task.js';
import { User } from '../../src/models/User.js';
import { migrateAcademicHierarchy } from '../../src/utils/migrateAcademicHierarchy.js';

let mongoServer;

async function login(email, password) {
  const response = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  return response.body.token;
}

async function seedEvaluationGraph(emailPrefix = 'base', { withClass = true } = {}) {
  const evaluatorPassword = 'Password123';
  const studentPassword = 'Student123';
  const evaluator = await User.create({
    name: 'Eva Evaluadora',
    email: `${emailPrefix}-evaluator@example.com`,
    password: evaluatorPassword,
    role: USER_ROLES.EVALUATOR,
    status: USER_STATUSES.ACTIVE
  });
  const student = await User.create({
    name: 'Sol Estudiante',
    email: `${emailPrefix}-student@example.com`,
    password: studentPassword,
    role: USER_ROLES.STUDENT,
    status: USER_STATUSES.ACTIVE
  });
  const group = await Group.create({
    name: 'Grupo A',
    evaluator: evaluator._id,
    students: [student._id]
  });
  student.groups = [group._id];
  await student.save();
  const instrument = await Instrument.create({
    title: 'Rubrica base',
    type: INSTRUMENT_TYPES.RUBRIC,
    evaluator: evaluator._id,
    status: INSTRUMENT_STATUSES.ACTIVE,
    criteria: [
      {
        name: 'Claridad',
        maxScore: 10,
        levels: [{ name: 'Excelente', score: 10 }]
      }
    ]
  });
  let course;
  let academicModule;
  let academicClass;
  let task;

  if (withClass) {
    course = await Course.create({ name: 'Curso base', evaluator: evaluator._id });
    academicModule = await AcademicModule.create({
      name: 'Módulo base',
      course: course._id,
      evaluator: evaluator._id
    });
    academicClass = await AcademicClass.create({
      name: 'Clase base',
      module: academicModule._id,
      course: course._id,
      evaluator: evaluator._id
    });
    task = await Task.create({
      title: 'Ensayo',
      evaluator: evaluator._id,
      class: academicClass._id,
      groups: [group._id],
      students: [student._id],
      instrument: instrument._id,
      status: TASK_STATUSES.PENDING,
      weight: 100
    });
  } else {
    // Bypasses the Task schema's `class` requirement to simulate legacy, pre-migration
    // documents that predate the academic hierarchy feature.
    const insertResult = await Task.collection.insertOne({
      title: 'Ensayo',
      evaluator: evaluator._id,
      groups: [group._id],
      students: [student._id],
      instrument: instrument._id,
      status: TASK_STATUSES.PENDING,
      weight: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    task = await Task.findById(insertResult.insertedId);
  }

  return {
    evaluator,
    evaluatorPassword,
    student,
    studentPassword,
    group,
    instrument,
    course,
    academicModule,
    academicClass,
    task
  };
}

async function seedPublishedEvaluation() {
  const graph = await seedEvaluationGraph('reports');
  const evaluation = await Evaluation.create({
    student: graph.student._id,
    evaluator: graph.evaluator._id,
    task: graph.task._id,
    instrument: graph.instrument._id,
    answers: [{ score: 9 }],
    score: 9,
    maxScore: 10,
    percentage: 90,
    feedback: 'Muy bien',
    status: EVALUATION_STATUSES.PUBLISHED,
    studentReportEnabled: true,
    evaluatedAt: new Date(),
    publishedAt: new Date()
  });

  return { ...graph, evaluation };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 60000
    }
  });
  await mongoose.connect(mongoServer.getUri());
}, 600000);

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('auth routes', () => {
  it('logs in an active user and returns a bearer token payload', async () => {
    await User.create({
      name: 'Ada Evaluadora',
      email: 'ada@example.com',
      password: 'Password123',
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'Password123' })
      .expect(200);

    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe('ada@example.com');
    expect(response.body.user.password).toBeUndefined();
  });

  it('rejects login for suspended users', async () => {
    await User.create({
      name: 'Ada Suspendida',
      email: 'suspended@example.com',
      password: 'Password123',
      role: USER_ROLES.STUDENT,
      status: USER_STATUSES.SUSPENDED
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'suspended@example.com', password: 'Password123' })
      .expect(403);

    expect(response.body.message).toBe('Tu cuenta no está activa');
  });

  it('resets a password with a valid unexpired reset token', async () => {
    const resetToken = 'reset-token-with-enough-length-for-validation';
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    await User.create({
      name: 'Ada Reset',
      email: 'reset@example.com',
      password: 'OldPassword123',
      role: USER_ROLES.STUDENT,
      status: USER_STATUSES.ACTIVE,
      passwordResetToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000)
    });

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: resetToken,
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'NewPassword123' })
      .expect(200);

    const user = await User.findOne({ email: 'reset@example.com' }).select('+passwordResetToken');
    expect(user.passwordResetToken).toBeUndefined();
  });
});

describe('student user routes', () => {
  it('lets an evaluator create and manage a student without assigning a group', async () => {
    await User.create({
      name: 'Eva Sin Grupo',
      email: 'evaluator-without-groups@example.com',
      password: 'Password123',
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    const token = await login('evaluator-without-groups@example.com', 'Password123');

    const createResponse = await request(app)
      .post('/api/users/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Luis Sin Grupo',
        email: 'luis.sin.grupo@example.com',
        password: 'Password123'
      })
      .expect(201);

    expect(createResponse.body.student.groups).toEqual([]);

    const studentId = createResponse.body.student.id || createResponse.body.student._id;

    const listResponse = await request(app)
      .get('/api/users/students')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listResponse.body.students).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'luis.sin.grupo@example.com',
          groups: []
        })
      ])
    );

    await request(app)
      .get(`/api/users/students/${studentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('lets an evaluator delete their own account logically', async () => {
    const evaluatorPassword = 'Password123';
    await User.create({
      name: 'Ernesto Evaluador',
      email: 'evaluator-self-delete@example.com',
      password: evaluatorPassword,
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });

    const token = await login('evaluator-self-delete@example.com', evaluatorPassword);

    const response = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        password: evaluatorPassword,
        reason: 'Solicitud propia'
      })
      .expect(200);

    expect(response.body.message).toContain('Cuenta eliminada lógicamente');

    const deletedEvaluator = await User.findOne({ email: 'evaluator-self-delete@example.com' });
    expect(deletedEvaluator.status).toBe(USER_STATUSES.DELETED);
    expect(deletedEvaluator.statusReason).toBe('Solicitud propia');
    expect(deletedEvaluator.deletedAt).toBeTruthy();
  });

  it('keeps admin self-delete blocked', async () => {
    const adminPassword = 'Password123';
    await User.create({
      name: 'Ada Admin',
      email: 'admin-self-delete@example.com',
      password: adminPassword,
      role: USER_ROLES.ADMIN,
      status: USER_STATUSES.ACTIVE
    });

    const token = await login('admin-self-delete@example.com', adminPassword);

    const response = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        password: adminPassword
      })
      .expect(403);

    expect(response.body.message).toContain('Solo estudiantes y evaluadores');
  });
});

describe('instrument routes', () => {
  it('updates checklist instruments with options and indicator metadata', async () => {
    const evaluatorPassword = 'Password123';
    await User.create({
      name: 'Iris Instrumentos',
      email: 'instruments-evaluator@example.com',
      password: evaluatorPassword,
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    const token = await login('instruments-evaluator@example.com', evaluatorPassword);

    const createResponse = await request(app)
      .post('/api/instruments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Lista inicial',
        description: 'Revision de participacion',
        type: INSTRUMENT_TYPES.CHECKLIST,
        status: INSTRUMENT_STATUSES.DRAFT,
        indicators: [{ text: 'Participa en clase', score: 1, required: false, observation: '' }],
        options: [
          { label: 'Cumple', scoreFactor: 1 },
          { label: 'No cumple', scoreFactor: 0 }
        ]
      })
      .expect(201);

    const instrumentId = createResponse.body.instrument.id || createResponse.body.instrument._id;

    const updateResponse = await request(app)
      .patch(`/api/instruments/${instrumentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Lista editada',
        indicators: [
          {
            text: 'Entrega evidencias completas',
            score: 2,
            required: true,
            observation: 'Solicitar fuente si falta evidencia'
          }
        ],
        options: [
          { label: 'Logrado', scoreFactor: 1 },
          { label: 'En proceso', scoreFactor: 0.5 },
          { label: 'No logrado', scoreFactor: 0 }
        ]
      })
      .expect(200);

    expect(updateResponse.body.instrument.title).toBe('Lista editada');
    expect(updateResponse.body.instrument.indicators[0]).toMatchObject({
      text: 'Entrega evidencias completas',
      score: 2,
      required: true,
      observation: 'Solicitar fuente si falta evidencia'
    });
    expect(updateResponse.body.instrument.options).toHaveLength(3);
    expect(updateResponse.body.instrument.options[1]).toMatchObject({
      label: 'En proceso',
      scoreFactor: 0.5
    });
  });

  it('rejects updates that leave a rubric without criteria', async () => {
    const { evaluatorPassword, instrument } = await seedEvaluationGraph('invalid-instrument');
    const token = await login('invalid-instrument-evaluator@example.com', evaluatorPassword);

    const response = await request(app)
      .patch(`/api/instruments/${instrument._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ criteria: [] })
      .expect(400);

    expect(response.body.message).toBe('El instrumento necesita criterios o indicadores válidos para su tipo');

    const persistedInstrument = await Instrument.findById(instrument._id);
    expect(persistedInstrument.criteria).toHaveLength(1);
  });

  it('marks an instrument as deleted (not archived) when deleted', async () => {
    const { evaluatorPassword, instrument } = await seedEvaluationGraph('delete-instrument');
    const token = await login('delete-instrument-evaluator@example.com', evaluatorPassword);

    const response = await request(app)
      .delete(`/api/instruments/${instrument._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.instrument.status).toBe(INSTRUMENT_STATUSES.DELETED);
    expect(response.body.instrument.status).not.toBe(INSTRUMENT_STATUSES.ARCHIVED);

    const persistedInstrument = await Instrument.findById(instrument._id);
    expect(persistedInstrument.status).toBe('deleted');
  });

  it('rejects permanently deleting an instrument that is still active', async () => {
    const { evaluatorPassword, instrument } = await seedEvaluationGraph('permanent-delete-active');
    const token = await login('permanent-delete-active-evaluator@example.com', evaluatorPassword);

    const response = await request(app)
      .delete(`/api/instruments/${instrument._id}/permanent`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body.message).toBe('Solo puedes eliminar definitivamente instrumentos archivados o eliminados');

    const persistedInstrument = await Instrument.findById(instrument._id);
    expect(persistedInstrument).not.toBeNull();
  });

  it('rejects permanently deleting an instrument still linked to a task', async () => {
    const { evaluatorPassword, instrument } = await seedEvaluationGraph('permanent-delete-linked');
    const token = await login('permanent-delete-linked-evaluator@example.com', evaluatorPassword);

    await request(app)
      .delete(`/api/instruments/${instrument._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const response = await request(app)
      .delete(`/api/instruments/${instrument._id}/permanent`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    expect(response.body.message).toBe(
      'Este instrumento está vinculado a tareas existentes. Quita la asignación antes de eliminarlo definitivamente.'
    );

    const persistedInstrument = await Instrument.findById(instrument._id);
    expect(persistedInstrument).not.toBeNull();
  });

  it('permanently deletes an archived instrument with no linked tasks', async () => {
    const evaluatorPassword = 'Password123';
    await User.create({
      name: 'Perla Purgadora',
      email: 'permanent-delete-clean-evaluator@example.com',
      password: evaluatorPassword,
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    const token = await login('permanent-delete-clean-evaluator@example.com', evaluatorPassword);

    const createResponse = await request(app)
      .post('/api/instruments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Instrumento sin uso',
        type: INSTRUMENT_TYPES.CHECKLIST,
        indicators: [{ text: 'Indicador único', score: 1, required: false, observation: '' }]
      })
      .expect(201);
    const instrumentId = createResponse.body.instrument.id || createResponse.body.instrument._id;

    await request(app)
      .delete(`/api/instruments/${instrumentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .delete(`/api/instruments/${instrumentId}/permanent`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const persistedInstrument = await Instrument.findById(instrumentId);
    expect(persistedInstrument).toBeNull();
  });
});

describe('academic hierarchy models', () => {
  it('creates a course-module-class hierarchy and links an existing task optionally', async () => {
    const { evaluator, task } = await seedEvaluationGraph('academic-hierarchy');

    const course = await Course.create({
      name: 'Curso general',
      evaluator: evaluator._id
    });
    const module = await AcademicModule.create({
      name: 'Módulo general',
      course: course._id,
      evaluator: evaluator._id,
      order: 1
    });
    const academicClass = await AcademicClass.create({
      name: 'Clase general',
      module: module._id,
      course: course._id,
      evaluator: evaluator._id,
      order: 1
    });

    task.class = academicClass._id;
    await task.save();

    const linkedTask = await Task.findById(task._id).populate('class');

    expect(course.status).toBe('active');
    expect(module.course.toString()).toBe(course._id.toString());
    expect(academicClass.module.toString()).toBe(module._id.toString());
    expect(linkedTask.class.name).toBe('Clase general');
  });
});

describe('academic hierarchy migration', () => {
  it('assigns orphan tasks to a general course, module, and class per evaluator', async () => {
    const firstGraph = await seedEvaluationGraph('migration-first', { withClass: false });
    const secondGraph = await seedEvaluationGraph('migration-second', { withClass: false });

    const summary = await migrateAcademicHierarchy();

    const [firstTask, secondTask] = await Promise.all([
      Task.findById(firstGraph.task._id).populate('class'),
      Task.findById(secondGraph.task._id).populate('class')
    ]);
    const courses = await Course.find().sort({ name: 1 });
    const modules = await AcademicModule.find();
    const classes = await AcademicClass.find();

    expect(summary.evaluators).toBe(2);
    expect(summary.tasksUpdated).toBe(2);
    expect(courses).toHaveLength(2);
    expect(modules).toHaveLength(2);
    expect(classes).toHaveLength(2);
    expect(firstTask.class.name).toBe('Clase general');
    expect(secondTask.class.name).toBe('Clase general');
  });

  it('is idempotent and preserves tasks that already have a class', async () => {
    const { evaluator, task } = await seedEvaluationGraph('migration-idempotent', { withClass: false });
    const customCourse = await Course.create({
      name: 'Curso personalizado',
      evaluator: evaluator._id
    });
    const customModule = await AcademicModule.create({
      name: 'Módulo personalizado',
      course: customCourse._id,
      evaluator: evaluator._id
    });
    const customClass = await AcademicClass.create({
      name: 'Clase personalizada',
      module: customModule._id,
      course: customCourse._id,
      evaluator: evaluator._id
    });

    task.class = customClass._id;
    await task.save();

    const firstRun = await migrateAcademicHierarchy();
    const secondRun = await migrateAcademicHierarchy();
    const persistedTask = await Task.findById(task._id).populate('class');

    expect(firstRun.tasksUpdated).toBe(0);
    expect(secondRun.tasksUpdated).toBe(0);
    expect(await Course.countDocuments({ evaluator: evaluator._id })).toBe(1);
    expect(await AcademicModule.countDocuments({ evaluator: evaluator._id })).toBe(1);
    expect(await AcademicClass.countDocuments({ evaluator: evaluator._id })).toBe(1);
    expect(persistedTask.class.name).toBe('Clase personalizada');
  });
});

describe('academic hierarchy routes', () => {
  it('creates and updates courses, modules, and classes for the evaluator', async () => {
    const evaluatorPassword = 'Password123';
    await User.create({
      name: 'Camila Cursos',
      email: 'hierarchy-routes@example.com',
      password: evaluatorPassword,
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    const token = await login('hierarchy-routes@example.com', evaluatorPassword);

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Operaciones básicas de oficina',
        description: 'Curso de práctica digital',
        location: 'Aula 3',
        startDate: '2026-08-12',
        endDate: '2026-08-20'
      })
      .expect(201);

    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;
    expect(courseResponse.body.course.location).toBe('Aula 3');
    expect(courseResponse.body.course.startDate).toContain('2026-08-12');
    expect(courseResponse.body.course.endDate).toContain('2026-08-20');

    const moduleResponse = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Manejo del sistema operativo',
        order: 1,
        startDate: '2026-07-12',
        endDate: '2026-08-13'
      })
      .expect(201);

    const moduleId = moduleResponse.body.module.id || moduleResponse.body.module._id;
    expect(moduleResponse.body.module.startDate).toContain('2026-07-12');
    expect(moduleResponse.body.module.endDate).toContain('2026-08-13');

    const classResponse = await request(app)
      .post(`/api/modules/${moduleId}/classes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Manejo del mouse',
        order: 1
      })
      .expect(201);

    const classId = classResponse.body.class.id || classResponse.body.class._id;

    const [coursesList, modulesList, classesList, updatedCourse, updatedClass] = await Promise.all([
      request(app).get('/api/courses').set('Authorization', `Bearer ${token}`).expect(200),
      request(app).get(`/api/courses/${courseId}/modules`).set('Authorization', `Bearer ${token}`).expect(200),
      request(app).get(`/api/modules/${moduleId}/classes`).set('Authorization', `Bearer ${token}`).expect(200),
      request(app)
        .patch(`/api/courses/${courseId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ location: 'Laboratorio 2', endDate: '2026-08-22' })
        .expect(200),
      request(app)
        .patch(`/api/classes/${classId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Práctica de mouse' })
        .expect(200)
    ]);

    expect(coursesList.body.courses).toHaveLength(1);
    expect(modulesList.body.modules[0].course.toString()).toBe(courseId);
    expect(modulesList.body.modules[0].participantCount).toBe(0);
    expect(classesList.body.classes[0].module.toString()).toBe(moduleId);
    expect(updatedCourse.body.course.location).toBe('Laboratorio 2');
    expect(updatedCourse.body.course.endDate).toContain('2026-08-22');
    expect(updatedClass.body.class.name).toBe('Práctica de mouse');
  });

  it('blocks archiving a course with active modules unless cascade=true, then cascades to modules and classes', async () => {
    const evaluatorPassword = 'Password123';
    await User.create({
      name: 'Cora Cascada',
      email: 'hierarchy-cascade-course@example.com',
      password: evaluatorPassword,
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    const token = await login('hierarchy-cascade-course@example.com', evaluatorPassword);

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Curso con contenido' })
      .expect(201);
    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;

    const moduleResponse = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Módulo con clases' })
      .expect(201);
    const moduleId = moduleResponse.body.module.id || moduleResponse.body.module._id;

    await request(app)
      .post(`/api/modules/${moduleId}/classes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clase activa' })
      .expect(201);

    await request(app).delete(`/api/courses/${courseId}`).set('Authorization', `Bearer ${token}`).expect(409);

    const cascadeResponse = await request(app)
      .delete(`/api/courses/${courseId}?cascade=true`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(cascadeResponse.body.course.status).toBe('archived');
    expect(cascadeResponse.body.cascade).toEqual({ modulesArchived: 1, classesArchived: 1 });

    const [refreshedModule, refreshedClasses] = await Promise.all([
      AcademicModule.findById(moduleId),
      AcademicClass.find({ module: moduleId })
    ]);

    expect(refreshedModule.status).toBe('archived');
    expect(refreshedClasses.every((academicClass) => academicClass.status === 'archived')).toBe(true);
  });

  it('blocks archiving a module with active classes unless cascade=true', async () => {
    const evaluatorPassword = 'Password123';
    await User.create({
      name: 'Marco Modulo',
      email: 'hierarchy-cascade-module@example.com',
      password: evaluatorPassword,
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    const token = await login('hierarchy-cascade-module@example.com', evaluatorPassword);

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Curso' })
      .expect(201);
    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;

    const moduleResponse = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Módulo' })
      .expect(201);
    const moduleId = moduleResponse.body.module.id || moduleResponse.body.module._id;

    await request(app)
      .post(`/api/modules/${moduleId}/classes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clase' })
      .expect(201);

    await request(app).delete(`/api/modules/${moduleId}`).set('Authorization', `Bearer ${token}`).expect(409);

    const cascadeResponse = await request(app)
      .delete(`/api/modules/${moduleId}?cascade=true`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(cascadeResponse.body.module.status).toBe('archived');
    expect(cascadeResponse.body.cascade).toEqual({ classesArchived: 1 });
  });

  it('archives a class with linked tasks when cascade=true without deleting the tasks', async () => {
    const evaluatorPassword = 'Password123';
    await User.create({
      name: 'Clara Clase',
      email: 'hierarchy-cascade-class@example.com',
      password: evaluatorPassword,
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    const token = await login('hierarchy-cascade-class@example.com', evaluatorPassword);

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Curso' })
      .expect(201);
    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;

    const moduleResponse = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Módulo' })
      .expect(201);
    const moduleId = moduleResponse.body.module.id || moduleResponse.body.module._id;

    const classResponse = await request(app)
      .post(`/api/modules/${moduleId}/classes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clase con tareas' })
      .expect(201);
    const classId = classResponse.body.class.id || classResponse.body.class._id;

    await request(app)
      .post(`/api/classes/${classId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarea vinculada' })
      .expect(201);

    await request(app).delete(`/api/classes/${classId}`).set('Authorization', `Bearer ${token}`).expect(409);

    const cascadeResponse = await request(app)
      .delete(`/api/classes/${classId}?cascade=true`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(cascadeResponse.body.class.status).toBe('archived');
    expect(cascadeResponse.body.linkedTasks).toBe(1);

    const remainingTasks = await Task.countDocuments({ class: classId });
    expect(remainingTasks).toBe(1);
  });

  it('keeps hierarchy records scoped to their evaluator', async () => {
    await User.create({
      name: 'Eva Uno',
      email: 'hierarchy-owner@example.com',
      password: 'Password123',
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    await User.create({
      name: 'Eva Dos',
      email: 'hierarchy-outsider@example.com',
      password: 'Password123',
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    const ownerToken = await login('hierarchy-owner@example.com', 'Password123');
    const outsiderToken = await login('hierarchy-outsider@example.com', 'Password123');

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Curso privado' })
      .expect(201);

    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;

    await request(app).get(`/api/courses/${courseId}`).set('Authorization', `Bearer ${outsiderToken}`).expect(404);

    const outsiderList = await request(app).get('/api/courses').set('Authorization', `Bearer ${outsiderToken}`).expect(200);

    expect(outsiderList.body.courses).toHaveLength(0);
  });

  it('filters the flat task list by courseId, moduleId, and classId', async () => {
    const { evaluatorPassword, group, instrument, student } = await seedEvaluationGraph('tasks-hierarchy-filter');
    const token = await login('tasks-hierarchy-filter-evaluator@example.com', evaluatorPassword);

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Curso filtro' })
      .expect(201);
    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;

    const moduleResponse = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Módulo filtro' })
      .expect(201);
    const moduleId = moduleResponse.body.module.id || moduleResponse.body.module._id;

    const classResponse = await request(app)
      .post(`/api/modules/${moduleId}/classes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clase filtro' })
      .expect(201);
    const classId = classResponse.body.class.id || classResponse.body.class._id;

    await request(app)
      .post(`/api/classes/${classId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarea dentro del filtro',
        groups: [group._id.toString()],
        students: [student._id.toString()],
        instrument: instrument._id.toString()
      })
      .expect(201);

    // seedEvaluationGraph already created one unrelated task under its own
    // "Curso base/Módulo base/Clase base" — the filters below must exclude it.
    const [byCourse, byModule, byClass, unfiltered] = await Promise.all([
      request(app).get('/api/tasks').query({ courseId }).set('Authorization', `Bearer ${token}`).expect(200),
      request(app).get('/api/tasks').query({ moduleId }).set('Authorization', `Bearer ${token}`).expect(200),
      request(app).get('/api/tasks').query({ classId }).set('Authorization', `Bearer ${token}`).expect(200),
      request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`).expect(200)
    ]);

    expect(byCourse.body.tasks).toHaveLength(1);
    expect(byCourse.body.tasks[0].title).toBe('Tarea dentro del filtro');
    expect(byModule.body.tasks).toHaveLength(1);
    expect(byClass.body.tasks).toHaveLength(1);
    expect(unfiltered.body.tasks).toHaveLength(2);
  });

  it('creates and lists tasks inside an evaluator class', async () => {
    const { evaluatorPassword, group, instrument, student } = await seedEvaluationGraph('class-tasks');
    const token = await login('class-tasks-evaluator@example.com', evaluatorPassword);

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Curso tareas' })
      .expect(201);
    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;

    const moduleResponse = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Módulo tareas' })
      .expect(201);
    const moduleId = moduleResponse.body.module.id || moduleResponse.body.module._id;

    const classResponse = await request(app)
      .post(`/api/modules/${moduleId}/classes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clase tareas' })
      .expect(201);
    const classId = classResponse.body.class.id || classResponse.body.class._id;

    const taskResponse = await request(app)
      .post(`/api/classes/${classId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Práctica contextual',
        groups: [group._id.toString()],
        students: [student._id.toString()],
        instrument: instrument._id.toString(),
        status: TASK_STATUSES.PENDING,
        dueDate: '2026-09-01',
        weight: 25
      })
      .expect(201);

    const listResponse = await request(app)
      .get(`/api/classes/${classId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const modulesResponse = await request(app)
      .get(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(taskResponse.body.task.class._id || taskResponse.body.task.class.id).toBe(classId);
    expect(listResponse.body.tasks).toHaveLength(1);
    expect(listResponse.body.tasks[0].title).toBe('Práctica contextual');
    expect(modulesResponse.body.modules[0].participantCount).toBe(1);
  });

  it('exposes the archived status of a task\'s course and module through the class populate', async () => {
    const { evaluatorPassword, group, instrument, student } = await seedEvaluationGraph('class-archived-chain');
    const token = await login('class-archived-chain-evaluator@example.com', evaluatorPassword);

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Curso encadenado' })
      .expect(201);
    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;

    const moduleResponse = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Módulo encadenado' })
      .expect(201);
    const moduleId = moduleResponse.body.module.id || moduleResponse.body.module._id;

    const classResponse = await request(app)
      .post(`/api/modules/${moduleId}/classes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clase encadenada' })
      .expect(201);
    const classId = classResponse.body.class.id || classResponse.body.class._id;

    await request(app)
      .post(`/api/classes/${classId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarea bajo curso archivado',
        groups: [group._id.toString()],
        students: [student._id.toString()],
        instrument: instrument._id.toString()
      })
      .expect(201);

    // Archives the course directly (bypassing the cascade endpoint) to simulate a course
    // archived while its module/class remain active, and confirm the task's class populate
    // still surfaces that ancestor's archived status.
    await request(app)
      .patch(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'archived' })
      .expect(200);

    const listResponse = await request(app)
      .get(`/api/classes/${classId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const [task] = listResponse.body.tasks;
    expect(task.class.status).toBe('active');
    expect(task.class.course.status).toBe('archived');
    expect(task.class.module.status).toBe('active');
  });

  it('rejects creating, updating, and deleting tasks under an archived course/module/class', async () => {
    const { evaluatorPassword, group, instrument, student } = await seedEvaluationGraph('archived-hierarchy-tasks');
    const token = await login('archived-hierarchy-tasks-evaluator@example.com', evaluatorPassword);

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Curso a archivar' })
      .expect(201);
    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;

    const moduleResponse = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Módulo a archivar' })
      .expect(201);
    const moduleId = moduleResponse.body.module.id || moduleResponse.body.module._id;

    const classResponse = await request(app)
      .post(`/api/modules/${moduleId}/classes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clase activa' })
      .expect(201);
    const classId = classResponse.body.class.id || classResponse.body.class._id;

    const taskResponse = await request(app)
      .post(`/api/classes/${classId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarea previa al archivado',
        groups: [group._id.toString()],
        students: [student._id.toString()],
        instrument: instrument._id.toString()
      })
      .expect(201);
    const taskId = taskResponse.body.task.id || taskResponse.body.task._id;

    await request(app)
      .patch(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'archived' })
      .expect(200);

    await request(app)
      .post(`/api/classes/${classId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarea nueva bajo curso archivado' })
      .expect(409);

    await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Intento de edición' })
      .expect(409);

    await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`).expect(409);
  });

  it('rejects creating tasks in another evaluator class', async () => {
    const ownerGraph = await seedEvaluationGraph('class-task-owner');
    await User.create({
      name: 'Evaluador externo',
      email: 'class-task-outsider@example.com',
      password: 'Password123',
      role: USER_ROLES.EVALUATOR,
      status: USER_STATUSES.ACTIVE
    });
    const ownerToken = await login('class-task-owner-evaluator@example.com', ownerGraph.evaluatorPassword);
    const outsiderToken = await login('class-task-outsider@example.com', 'Password123');

    const courseResponse = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Curso privado tareas' })
      .expect(201);
    const courseId = courseResponse.body.course.id || courseResponse.body.course._id;

    const moduleResponse = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Módulo privado tareas' })
      .expect(201);
    const moduleId = moduleResponse.body.module.id || moduleResponse.body.module._id;

    const classResponse = await request(app)
      .post(`/api/modules/${moduleId}/classes`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Clase privada tareas' })
      .expect(201);
    const classId = classResponse.body.class.id || classResponse.body.class._id;

    await request(app)
      .post(`/api/classes/${classId}/tasks`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ title: 'No permitida' })
      .expect(404);
  });
});

describe('task routes', () => {
  it('creates, updates, lists, and deletes evaluator tasks with relations', async () => {
    const { evaluatorPassword, group, instrument, student, academicClass } = await seedEvaluationGraph('tasks-crud');
    const token = await login('tasks-crud-evaluator@example.com', evaluatorPassword);

    const createResponse = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Proyecto lector',
        description: 'Primera entrega del proyecto',
        class: academicClass._id.toString(),
        groups: [group._id.toString()],
        students: [student._id.toString()],
        instrument: instrument._id.toString(),
        status: TASK_STATUSES.PENDING,
        dueDate: '2026-08-10',
        weight: 40
      })
      .expect(201);

    const taskId = createResponse.body.task.id || createResponse.body.task._id;
    expect(createResponse.body.task.groups[0].name).toBe('Grupo A');
    expect(createResponse.body.task.students).toHaveLength(1);
    expect(createResponse.body.task.instrument.title).toBe('Rubrica base');

    const updateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Proyecto lector actualizado',
        status: TASK_STATUSES.COMPLETED,
        dueDate: '2026-08-12',
        weight: 75
      })
      .expect(200);

    expect(updateResponse.body.task).toMatchObject({
      title: 'Proyecto lector actualizado',
      status: TASK_STATUSES.COMPLETED,
      weight: 75
    });

    const listResponse = await request(app)
      .get('/api/tasks')
      .query({ search: 'lector actualizado', limit: 10 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listResponse.body.tasks.some((task) => (task.id || task._id) === taskId)).toBe(true);

    await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).get(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`).expect(404);
  });

  it('rejects unsupported task statuses', async () => {
    const { evaluatorPassword, group, instrument, student, academicClass } = await seedEvaluationGraph('tasks-statuses');
    const token = await login('tasks-statuses-evaluator@example.com', evaluatorPassword);

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Estado no permitido',
        class: academicClass._id.toString(),
        groups: [group._id.toString()],
        students: [student._id.toString()],
        instrument: instrument._id.toString(),
        status: 'in_progress'
      })
      .expect(400);
  });

  it('rejects creating a task without a class', async () => {
    const { evaluatorPassword, group, instrument, student } = await seedEvaluationGraph('tasks-no-class');
    const token = await login('tasks-no-class-evaluator@example.com', evaluatorPassword);

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tarea sin clase',
        groups: [group._id.toString()],
        students: [student._id.toString()],
        instrument: instrument._id.toString()
      })
      .expect(400);
  });

  it('allows partial updates to the task due date', async () => {
    const { evaluatorPassword, task } = await seedEvaluationGraph('tasks-dates');
    const token = await login('tasks-dates-evaluator@example.com', evaluatorPassword);

    task.dueDate = new Date('2026-08-15T00:00:00.000Z');
    await task.save();

    await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dueDate: '2026-08-01' })
      .expect(200);

    const persistedTask = await Task.findById(task._id);
    expect(persistedTask.dueDate.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });
});

describe('evaluation routes', () => {
  it('creates, publishes, and exposes a published evaluation to the student', async () => {
    const { evaluatorPassword, student, studentPassword, task } = await seedEvaluationGraph('evaluations');
    const evaluatorToken = await login('evaluations-evaluator@example.com', evaluatorPassword);

    const createResponse = await request(app)
      .post('/api/evaluations')
      .set('Authorization', `Bearer ${evaluatorToken}`)
      .send({
        student: student._id.toString(),
        task: task._id.toString(),
        answers: [{ score: 8, observation: 'Buen avance' }],
        feedback: 'Buen trabajo',
        status: EVALUATION_STATUSES.COMPLETED
      })
      .expect(201);

    expect(createResponse.body.evaluation.percentage).toBe(80);

    const evaluationId = createResponse.body.evaluation.id || createResponse.body.evaluation._id;
    const publishResponse = await request(app)
      .patch(`/api/evaluations/${evaluationId}/publish`)
      .set('Authorization', `Bearer ${evaluatorToken}`)
      .expect(200);

    expect(publishResponse.body.evaluation.status).toBe(EVALUATION_STATUSES.PUBLISHED);
    expect(publishResponse.body.evaluation.publishedAt).toEqual(expect.any(String));

    const studentToken = await login('evaluations-student@example.com', studentPassword);
    const listResponse = await request(app)
      .get('/api/evaluations')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(listResponse.body.evaluations).toHaveLength(1);
    expect(listResponse.body.evaluations[0].status).toBe(EVALUATION_STATUSES.PUBLISHED);
  });
});

describe('message routes', () => {
  it('lets a student message their evaluator and read the thread', async () => {
    const graph = await seedEvaluationGraph('messages-student');
    const studentToken = await login(graph.student.email, graph.studentPassword);

    const contactsResponse = await request(app)
      .get('/api/messages/contacts')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(contactsResponse.body.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user: expect.objectContaining({
            id: String(graph.evaluator._id),
            role: USER_ROLES.EVALUATOR,
          }),
        }),
      ])
    );

    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        recipientId: String(graph.evaluator._id),
        body: 'Hola profesor, tengo una duda.',
      })
      .expect(201);

    const threadResponse = await request(app)
      .get(`/api/messages/thread/${graph.evaluator._id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(threadResponse.body.contact.id).toBe(String(graph.evaluator._id));
    expect(threadResponse.body.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          body: 'Hola profesor, tengo una duda.',
          direction: 'outgoing',
        }),
      ])
    );
  });

  it('lets an evaluator message an admin directly', async () => {
    const graph = await seedEvaluationGraph('messages-evaluator');
    const adminPassword = 'Password123';
    const admin = await User.create({
      name: 'Ada Admin',
      email: 'messages-admin@example.com',
      password: adminPassword,
      role: USER_ROLES.ADMIN,
      status: USER_STATUSES.ACTIVE,
    });
    const evaluatorToken = await login(graph.evaluator.email, graph.evaluatorPassword);
    const adminToken = await login(admin.email, adminPassword);

    await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${evaluatorToken}`)
      .send({
        recipientId: String(admin._id),
        body: 'Necesito apoyo con una evaluación.',
      })
      .expect(201);

    const contactsResponse = await request(app)
      .get('/api/messages/contacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(contactsResponse.body.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unreadCount: 1,
          user: expect.objectContaining({
            id: String(graph.evaluator._id),
            role: USER_ROLES.EVALUATOR,
          }),
        }),
      ])
    );
  });

  it('blocks admins from messaging students directly', async () => {
    const adminPassword = 'Password123';
    const studentPassword = 'Password123';
    await User.create({
      name: 'Admin Mensajes',
      email: 'messages-admin-blocked@example.com',
      password: adminPassword,
      role: USER_ROLES.ADMIN,
      status: USER_STATUSES.ACTIVE,
    });
    const student = await User.create({
      name: 'Sonia Estudiante',
      email: 'messages-student-blocked@example.com',
      password: studentPassword,
      role: USER_ROLES.STUDENT,
      status: USER_STATUSES.ACTIVE,
    });

    const adminToken = await login('messages-admin-blocked@example.com', adminPassword);

    const response = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipientId: String(student._id),
        body: 'Hola',
      })
      .expect(403);

    expect(response.body.message).toContain('No puedes enviar mensajes');
  });
});

describe('report routes', () => {
  it('returns group reports using the shared report serializer', async () => {
    const { evaluatorPassword, group } = await seedPublishedEvaluation();
    const token = await login('reports-evaluator@example.com', evaluatorPassword);

    const response = await request(app)
      .get(`/api/reports/group/${group._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.report.type).toBe('group');
    expect(response.body.report.summary.count).toBe(1);
    expect(response.body.report.evaluations[0].studentReportEnabled).toBe(true);
  });

  it('filters group reports by course hierarchy', async () => {
    const graph = await seedPublishedEvaluation();
    const token = await login('reports-evaluator@example.com', graph.evaluatorPassword);
    const secondCourse = await Course.create({
      name: 'Curso alterno',
      evaluator: graph.evaluator._id
    });
    const secondModule = await AcademicModule.create({
      name: 'Módulo alterno',
      course: secondCourse._id,
      evaluator: graph.evaluator._id
    });
    const secondClass = await AcademicClass.create({
      name: 'Clase alterna',
      module: secondModule._id,
      course: secondCourse._id,
      evaluator: graph.evaluator._id
    });
    const secondTask = await Task.create({
      title: 'Tarea de otro curso',
      evaluator: graph.evaluator._id,
      class: secondClass._id,
      groups: [graph.group._id],
      students: [graph.student._id],
      instrument: graph.instrument._id,
      status: TASK_STATUSES.COMPLETED,
      weight: 100
    });

    await Evaluation.create({
      student: graph.student._id,
      evaluator: graph.evaluator._id,
      task: secondTask._id,
      instrument: graph.instrument._id,
      answers: [{ score: 7 }],
      score: 7,
      maxScore: 10,
      percentage: 70,
      feedback: 'Curso alterno',
      status: EVALUATION_STATUSES.PUBLISHED,
      evaluatedAt: new Date(),
      publishedAt: new Date()
    });

    const unfilteredResponse = await request(app)
      .get(`/api/reports/group/${graph.group._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const filteredResponse = await request(app)
      .get(`/api/reports/group/${graph.group._id}`)
      .query({ courseId: graph.course._id.toString() })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(unfilteredResponse.body.report.evaluations).toHaveLength(2);
    expect(filteredResponse.body.report.evaluations).toHaveLength(1);
    expect(filteredResponse.body.report.evaluations[0].task.title).toBe('Ensayo');
    expect(filteredResponse.body.report.filters.courseId).toBe(graph.course._id.toString());
  });

  it('returns task and instrument report summaries', async () => {
    const { evaluatorPassword, task, instrument } = await seedPublishedEvaluation();
    const token = await login('reports-evaluator@example.com', evaluatorPassword);

    const [taskResponse, instrumentResponse] = await Promise.all([
      request(app).get(`/api/reports/task/${task._id}`).set('Authorization', `Bearer ${token}`).expect(200),
      request(app).get(`/api/reports/instruments/${instrument._id}`).set('Authorization', `Bearer ${token}`).expect(200)
    ]);

    expect(taskResponse.body.report.type).toBe('task');
    expect(taskResponse.body.report.summary.average).toBe(90);
    expect(instrumentResponse.body.report.type).toBe('instrument');
    expect(instrumentResponse.body.report.summary.count).toBe(1);
  });
});
