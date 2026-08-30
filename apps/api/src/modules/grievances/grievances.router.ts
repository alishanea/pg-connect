import { Router } from 'express';
import {
  listGrievances,
  createGrievance,
  getGrievanceById,
  updateGrievance,
  addComment,
} from './grievances.controller';
import { authenticate } from '../../middleware/auth';

export const grievancesRouter = Router();

grievancesRouter.use(authenticate);

grievancesRouter.get('/', listGrievances);
grievancesRouter.post('/', createGrievance);
grievancesRouter.get('/:id', getGrievanceById);
grievancesRouter.patch('/:id', updateGrievance);
grievancesRouter.post('/:id/comments', addComment);
