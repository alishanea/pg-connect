import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { withTenantScope } from '../../middleware/tenantScope';
import { Role } from '../../types/enums';

const createAnnouncementSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(5),
});

export async function listAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const pgId = req.user!.pgId;
    if (!pgId) {
      return res.status(400).json({ error: { code: 'NO_PG_LINKED', message: 'User is not linked to any PG' } });
    }

    const where = withTenantScope({}, pgId);
    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.json({ announcements });
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const pgId = req.user!.pgId;
    if (!pgId) {
      return res.status(400).json({ error: { code: 'NO_PG_LINKED', message: 'User is not linked to any PG' } });
    }

    const input = createAnnouncementSchema.parse(req.body);

    const announcement = await prisma.announcement.create({
      data: {
        pgId,
        authorUserId: req.user!.userId,
        title: input.title,
        body: input.body,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // Send in-app notification to all residents in this PG
    const residents = await prisma.user.findMany({
      where: withTenantScope({ role: Role.RESIDENT }, pgId),
    });

    if (residents.length > 0) {
      await Promise.all(
        residents.map((resUser: { id: string }) =>
          prisma.notification.create({
            data: {
              userId: resUser.id,
              type: 'ANNOUNCEMENT_POSTED',
              message: `Announcement: "${announcement.title}"`,
            },
          })
        )
      );
    }

    return res.status(201).json({ announcement });
  } catch (err) {
    next(err);
  }
}
