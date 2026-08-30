import { Router } from 'express';
import { getAnalyticsSummary } from './analytics.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '../../types/enums';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get('/summary', authorize([Role.ADMIN]), getAnalyticsSummary);
