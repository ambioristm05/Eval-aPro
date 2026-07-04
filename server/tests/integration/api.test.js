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
import { Evaluation } from '../../src/models/Evaluation.js';
import { Group } from '../../src/models/Group.js';
import { Instrument } from '../../src/models/Instrument.js';
import { Task } from '../../src/models/Task.js';
import { User } from '../../src/models/User.js';

let mongoServer;

async function login(email, password) {
  const response = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  return response.body.token;
}

async function seedEvaluationGraph(emailPrefix = 'base') {
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
  const task = await Task.create({
    title: 'Ensayo',
    evaluator: evaluator._id,
    group: group._id,
    students: [student._id],
    instrument: instrument._id,
    status: TASK_STATUSES.PENDING,
    weight: 100
  });

  return {
    evaluator,
    evaluatorPassword,
    student,
    studentPassword,
    group,
    instrument,
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
