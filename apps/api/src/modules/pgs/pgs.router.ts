import { Router } from 'express';
import {
  createPg,
  getPgs,
  createRoom,
  getRooms,
  generateInviteCode,
  getResidents,
  assignResidentRoom,
} from './pgs.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { Role } from '../../types/enums';

export const pgsRouter = Router();

pgsRouter.use(authenticate);

pgsRouter.post('/', authorize([Role.ADMIN]), createPg);
pgsRouter.get('/', authorize([Role.ADMIN]), getPgs);
pgsRouter.post('/:pgId/rooms', authorize([Role.ADMIN]), createRoom);
pgsRouter.get('/:pgId/rooms', getRooms);
pgsRouter.post('/:pgId/invite-codes', authorize([Role.ADMIN]), generateInviteCode);
pgsRouter.get('/:pgId/residents', getResidents);
pgsRouter.patch('/:pgId/residents/:userId/room', authorize([Role.ADMIN]), assignResidentRoom);
