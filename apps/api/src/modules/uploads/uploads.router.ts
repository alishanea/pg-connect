import { Router } from 'express';
import { getPresignedUrl } from './uploads.controller';
import { authenticate } from '../../middleware/auth';

export const uploadsRouter = Router();

uploadsRouter.get('/presign', authenticate, getPresignedUrl);
uploadsRouter.put('/mock-put/*', (req, res) => {
  return res.status(200).json({ message: 'Mock photo upload successful' });
});
