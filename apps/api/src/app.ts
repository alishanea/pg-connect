import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.router';
import { pgsRouter } from './modules/pgs/pgs.router';
import { grievancesRouter } from './modules/grievances/grievances.router';
import { uploadsRouter } from './modules/uploads/uploads.router';
import { announcementsRouter } from './modules/announcements/announcements.router';
import { notificationsRouter } from './modules/notifications/notifications.router';
import { analyticsRouter } from './modules/analytics/analytics.router';

export const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login/signup attempts. Please try again later.' } },
});

// Root welcome endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'PG Connect API Server is running!',
    healthCheck: '/health',
    webAppUrl: 'http://localhost:5173',
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/pgs', pgsRouter);
app.use('/api/v1/grievances', grievancesRouter);
app.use('/api/v1/uploads', uploadsRouter);
app.use('/api/v1/announcements', announcementsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Global Error Handler
app.use(errorHandler);
