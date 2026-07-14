import { Router } from 'express';
import auditRoutes from './audit.routes.js';
import authRoutes from './auth.routes.js';
import classRoutes from './class.routes.js';
import courseRoutes from './course.routes.js';
import evaluationRoutes from './evaluation.routes.js';
import groupRoutes from './group.routes.js';
import instrumentRoutes from './instrument.routes.js';
import invitationRoutes from './invitation.routes.js';
import messageRoutes from './message.routes.js';
import moduleRoutes from './module.routes.js';
import reportRoutes from './report.routes.js';
import resultRoutes from './result.routes.js';
import settingsRoutes from './settings.routes.js';
import statisticsRoutes from './statistics.routes.js';
import taskRoutes from './task.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'evaluapro-api',
    timestamp: new Date().toISOString()
  });
});

router.use('/audit', auditRoutes);
router.use('/auth', authRoutes);
router.use('/classes', classRoutes);
router.use('/courses', courseRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/groups', groupRoutes);
router.use('/instruments', instrumentRoutes);
router.use('/invitations', invitationRoutes);
router.use('/messages', messageRoutes);
router.use('/modules', moduleRoutes);
router.use('/reports', reportRoutes);
router.use('/results', resultRoutes);
router.use('/settings', settingsRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

export default router;
