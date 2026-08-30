import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { withTenantScope } from '../../middleware/tenantScope';
import { Category, Role, Status } from '../../types/enums';

const createGrievanceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.nativeEnum(Category),
  photoUrl: z.string().nullable().optional(),
});

const updateGrievanceSchema = z.object({
  status: z.nativeEnum(Status).optional(),
  assignedToUserId: z.string().nullable().optional(),
});

const createCommentSchema = z.object({
  body: z.string().min(1),
});

export async function listGrievances(req: Request, res: Response, next: NextFunction) {
  try {
    const pgId = req.user!.pgId;
    if (!pgId) {
      return res.status(400).json({ error: { code: 'NO_PG_LINKED', message: 'User is not linked to any PG' } });
    }

    const { status, category, roomId, raisedByMe } = req.query;

    const baseWhere: any = {};
    if (status && typeof status === 'string') {
      baseWhere.status = status as Status;
    }
    if (category && typeof category === 'string') {
      baseWhere.category = category as Category;
    }
    if (roomId && typeof roomId === 'string') {
      baseWhere.roomId = roomId;
    }
    if (raisedByMe === 'true' || req.user!.role === Role.RESIDENT) {
      baseWhere.raisedByUserId = req.user!.userId;
    }

    const where = withTenantScope(baseWhere, pgId);

    const grievances = await prisma.grievance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        raisedByUser: {
          select: { id: true, name: true, email: true },
        },
        assignedToUser: {
          select: { id: true, name: true },
        },
        room: {
          select: { id: true, roomNumber: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    return res.json({ grievances });
  } catch (err) {
    next(err);
  }
}

export async function createGrievance(req: Request, res: Response, next: NextFunction) {
  try {
    const pgId = req.user!.pgId;
    if (!pgId) {
      return res.status(400).json({ error: { code: 'NO_PG_LINKED', message: 'User is not linked to any PG' } });
    }

    const input = createGrievanceSchema.parse(req.body);

    const grievance = await prisma.grievance.create({
      data: {
        pgId,
        roomId: req.user!.roomId || null,
        raisedByUserId: req.user!.userId,
        title: input.title,
        description: input.description,
        category: input.category,
        photoUrl: input.photoUrl || null,
        status: Status.OPEN,
      },
      include: {
        raisedByUser: { select: { id: true, name: true } },
        room: { select: { id: true, roomNumber: true } },
      },
    });

    // Notify staff/admins of the PG
    const staffAndAdmins = await prisma.user.findMany({
      where: withTenantScope(
        {
          role: { in: [Role.ADMIN, Role.STAFF] },
        },
        pgId
      ),
    });

    if (staffAndAdmins.length > 0) {
      await Promise.all(
        staffAndAdmins.map((staff: { id: string }) =>
          prisma.notification.create({
            data: {
              userId: staff.id,
              type: 'GRIEVANCE_RAISED',
              message: `New grievance raised: "${grievance.title}"`,
              relatedGrievanceId: grievance.id,
            },
          })
        )
      );
    }

    return res.status(201).json({ grievance });
  } catch (err) {
    next(err);
  }
}

export async function getGrievanceById(req: Request, res: Response, next: NextFunction) {
  try {
    const pgId = req.user!.pgId;
    const { id } = req.params;

    if (!pgId) {
      return res.status(400).json({ error: { code: 'NO_PG_LINKED', message: 'User is not linked to any PG' } });
    }

    const where = withTenantScope({ id }, pgId);
    const grievance = await prisma.grievance.findFirst({
      where,
      include: {
        raisedByUser: { select: { id: true, name: true, email: true } },
        assignedToUser: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, roomNumber: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!grievance) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Grievance ticket not found' } });
    }

    return res.json({ grievance });
  } catch (err) {
    next(err);
  }
}

export async function updateGrievance(req: Request, res: Response, next: NextFunction) {
  try {
    const pgId = req.user!.pgId;
    const { id } = req.params;

    if (!pgId) {
      return res.status(400).json({ error: { code: 'NO_PG_LINKED', message: 'User is not linked to any PG' } });
    }

    const input = updateGrievanceSchema.parse(req.body);

    const existing = await prisma.grievance.findFirst({
      where: withTenantScope({ id }, pgId),
    });

    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Grievance ticket not found' } });
    }

    // Role check: Resident can only close their own grievance
    if (req.user!.role === Role.RESIDENT) {
      if (existing.raisedByUserId !== req.user!.userId) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Cannot edit another resident\'s grievance' } });
      }
      if (input.status && input.status !== Status.CLOSED) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Residents can only mark grievance as CLOSED' } });
      }
      if (input.assignedToUserId) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Residents cannot assign staff' } });
      }
    }

    const dataToUpdate: any = {};
    if (input.status) {
      dataToUpdate.status = input.status;
      if (input.status === Status.RESOLVED || input.status === Status.CLOSED) {
        dataToUpdate.resolvedAt = new Date();
      }
    }
    if (input.assignedToUserId !== undefined) {
      dataToUpdate.assignedToUserId = input.assignedToUserId;
    }

    const updated = await prisma.grievance.update({
      where: { id },
      data: dataToUpdate,
      include: {
        raisedByUser: { select: { id: true, name: true } },
        assignedToUser: { select: { id: true, name: true } },
      },
    });

    // Send notification to creator
    if (input.status && existing.raisedByUserId !== req.user!.userId) {
      await prisma.notification.create({
        data: {
          userId: existing.raisedByUserId,
          type: 'GRIEVANCE_STATUS_UPDATE',
          message: `Your grievance "${existing.title}" status changed to ${input.status}`,
          relatedGrievanceId: existing.id,
        },
      });
    }

    return res.json({ grievance: updated });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const pgId = req.user!.pgId;
    const { id: grievanceId } = req.params;

    if (!pgId) {
      return res.status(400).json({ error: { code: 'NO_PG_LINKED', message: 'User is not linked to any PG' } });
    }

    const input = createCommentSchema.parse(req.body);

    const grievance = await prisma.grievance.findFirst({
      where: withTenantScope({ id: grievanceId }, pgId),
    });

    if (!grievance) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Grievance ticket not found' } });
    }

    const comment = await prisma.grievanceComment.create({
      data: {
        grievanceId,
        authorUserId: req.user!.userId,
        body: input.body,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    // Notify ticket author if someone else commented
    if (grievance.raisedByUserId !== req.user!.userId) {
      await prisma.notification.create({
        data: {
          userId: grievance.raisedByUserId,
          type: 'GRIEVANCE_COMMENT_ADDED',
          message: `New comment on your grievance "${grievance.title}" by ${comment.author.name}`,
          relatedGrievanceId: grievance.id,
        },
      });
    }

    return res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
}
