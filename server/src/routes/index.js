import { Router } from 'express';
import authRoutes from './auth.routes.js';
import groupRoutes from './group.routes.js';
import invitationRoutes from './invitation.routes.js';
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

router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/invitations', invitationRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

export default router;
