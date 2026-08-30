import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db/prisma';

describe('PG Connect API Integration Tests', () => {
  let adminToken: string;
  let residentToken: string;
  let pgId: string;
  let inviteCode: string;
  let grievanceId: string;

  beforeAll(async () => {
    // Push database schema
    await prisma.$connect();
    await prisma.notification.deleteMany();
    await prisma.grievanceComment.deleteMany();
    await prisma.grievance.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.inviteCode.deleteMany();
    await prisma.user.deleteMany();
    await prisma.room.deleteMany();
    await prisma.pG.deleteMany();
  });

  it('1. POST /api/v1/auth/signup - Admin creates account and PG property', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Owner Admin',
        email: 'admin@test.com',
        password: 'password123',
        pgName: 'Greenwood PG',
        pgAddress: '123 Main St',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.role).toBe('ADMIN');
    expect(res.body.user.pgId).toBeDefined();
    expect(res.body.accessToken).toBeDefined();

    adminToken = res.body.accessToken;
    pgId = res.body.user.pgId;
  });

  it('2. POST /api/v1/pgs/:pgId/invite-codes - Admin generates resident invite code', async () => {
    const res = await request(app)
      .post(`/api/v1/pgs/${pgId}/invite-codes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleGranted: 'RESIDENT' });

    expect(res.status).toBe(201);
    expect(res.body.invite.code).toBeDefined();
    inviteCode = res.body.invite.code;
  });

  it('3. POST /api/v1/auth/signup - Resident signs up using invite code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Resident John',
        email: 'john@test.com',
        password: 'password123',
        inviteCode,
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('RESIDENT');
    expect(res.body.user.pgId).toBe(pgId);

    residentToken = res.body.accessToken;
  });

  it('4. POST /api/v1/grievances - Resident raises a grievance', async () => {
    const res = await request(app)
      .post('/api/v1/grievances')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        title: 'Water Leak in Bathroom',
        description: 'Tap leak is causing water waste in bathroom.',
        category: 'MAINTENANCE',
      });

    expect(res.status).toBe(201);
    expect(res.body.grievance.title).toBe('Water Leak in Bathroom');
    expect(res.body.grievance.status).toBe('OPEN');
    grievanceId = res.body.grievance.id;
  });

  it('5. GET /api/v1/grievances - Admin lists open grievances', async () => {
    const res = await request(app)
      .get('/api/v1/grievances')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.grievances.length).toBeGreaterThanOrEqual(1);
    expect(res.body.grievances[0].id).toBe(grievanceId);
  });

  it('6. PATCH /api/v1/grievances/:id - Admin changes status to IN_PROGRESS', async () => {
    const res = await request(app)
      .patch(`/api/v1/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.grievance.status).toBe('IN_PROGRESS');
  });

  it('7. POST /api/v1/grievances/:id/comments - Admin posts a comment', async () => {
    const res = await request(app)
      .post(`/api/v1/grievances/${grievanceId}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ body: 'Plumber assigned, visiting today.' });

    expect(res.status).toBe(201);
    expect(res.body.comment.body).toBe('Plumber assigned, visiting today.');
  });

  it('8. POST /api/v1/announcements - Admin creates an announcement', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Maintenance Notice',
        body: 'Power outage expected tomorrow between 2-4 PM.',
      });

    expect(res.status).toBe(201);
    expect(res.body.announcement.title).toBe('Maintenance Notice');
  });

  it('9. GET /api/v1/analytics/summary - Admin fetches analytics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary.totalCount).toBeGreaterThanOrEqual(1);
  });

  it('10. Multi-tenant Boundary Test - User from PG 2 cannot read PG 1 grievance', async () => {
    // Admin 2 in another PG
    const signupPg2 = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Other Owner',
        email: 'other@test.com',
        password: 'password123',
        pgName: 'Other PG',
        pgAddress: '456 Other St',
      });

    const otherToken = signupPg2.body.accessToken;

    const res = await request(app)
      .get(`/api/v1/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
