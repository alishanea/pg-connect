import { Router } from 'express';
import { listAnnouncements, createAnnouncement } from './announcements.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '../../types/enums';

export const announcementsRouter = Router();

announcementsRouter.use(authenticate);

announcementsRouter.get('/', listAnnouncements);
announcementsRouter.post('/', authorize([Role.ADMIN]), createAnnouncement);
