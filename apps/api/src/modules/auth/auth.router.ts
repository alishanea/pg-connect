import { Router } from 'express';
import { signup, login, getCurrentUser, refresh } from './auth.controller';
import { authenticate } from '../../middleware/auth';

export const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.get('/me', authenticate, getCurrentUser);
