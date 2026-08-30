import { Router } from 'express';
import { listNotifications, markAsRead } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get('/', listNotifications);
notificationsRouter.patch('/:id/read', markAsRead);
