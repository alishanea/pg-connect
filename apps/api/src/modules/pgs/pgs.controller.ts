import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { withTenantScope } from '../../middleware/tenantScope';
import { Role } from '../../types/enums';

const createPgSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
});

const createRoomSchema = z.object({
  roomNumber: z.string().min(1),
  capacity: z.number().int().min(1),
});

const generateInviteCodeSchema = z.object({
  roleGranted: z.enum(['RESIDENT', 'STAFF']).default('RESIDENT'),
  expiresInHours: z.number().int().positive().optional(),
});

const assignRoomSchema = z.object({
  roomId: z.string().uuid().nullable(),
});

export async function createPg(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createPgSchema.parse(req.body);
    const ownerId = req.user!.userId;

    const pg = await prisma.pG.create({
      data: {
        name: input.name,
        address: input.address,
        ownerId,
      },
    });

    // Update user's pgId if not set
    if (!req.user!.pgId) {
      await prisma.user.update({
        where: { id: ownerId },
        data: { pgId: pg.id },
      });
    }

    return res.status(201).json({ pg });
  } catch (err) {
    next(err);
  }
}

export async function getPgs(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const pgs = await prisma.pG.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: { users: true, rooms: true, grievances: true },
        },
      },
    });

    return res.json({ pgs });
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { pgId } = req.params;
    const user = req.user!;
    if (user.role !== Role.ADMIN || (user.pgId && user.pgId !== pgId)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized for this PG' } });
    }

    const input = createRoomSchema.parse(req.body);

    const room = await prisma.room.create({
      data: {
        pgId,
        roomNumber: input.roomNumber,
        capacity: input.capacity,
      },
    });

    return res.status(201).json({ room });
  } catch (err) {
    next(err);
  }
}

export async function getRooms(req: Request, res: Response, next: NextFunction) {
  try {
    const { pgId } = req.params;
    const user = req.user!;
    const targetPgId = user.pgId || pgId;

    if (user.pgId && user.pgId !== pgId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Cannot access rooms of another PG' } });
    }

    const where = withTenantScope({}, targetPgId);
    const rooms = await prisma.room.findMany({
      where,
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return res.json({ rooms });
  } catch (err) {
    next(err);
  }
}

export async function generateInviteCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { pgId } = req.params;
    const user = req.user!;
    if (user.role !== Role.ADMIN || (user.pgId && user.pgId !== pgId)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized to generate invite code' } });
    }

    const input = generateInviteCodeSchema.parse(req.body);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    let expiresAt: Date | null = null;
    if (input.expiresInHours) {
      expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);
    }

    const invite = await prisma.inviteCode.create({
      data: {
        pgId,
        code,
        roleGranted: input.roleGranted,
        expiresAt,
      },
    });

    return res.status(201).json({ invite });
  } catch (err) {
    next(err);
  }
}

export async function getResidents(req: Request, res: Response, next: NextFunction) {
  try {
    const userPgId = req.user!.pgId;
    if (!userPgId) {
      return res.status(400).json({ error: { code: 'NO_PG_LINKED', message: 'User is not linked to any PG' } });
    }

    const where = withTenantScope({ role: Role.RESIDENT }, userPgId);
    const residents = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        room: {
          select: {
            roomNumber: true,
          },
        },
        createdAt: true,
      },
    });

    return res.json({ residents });
  } catch (err) {
    next(err);
  }
}

export async function assignResidentRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const { pgId, userId } = req.params;
    const user = req.user!;
    if (user.role !== Role.ADMIN || user.pgId !== pgId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Unauthorized for this PG' } });
    }

    const input = assignRoomSchema.parse(req.body);

    const resident = await prisma.user.findFirst({
      where: withTenantScope({ id: userId }, pgId),
    });

    if (!resident) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resident not found in this PG' } });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roomId: input.roomId },
      include: { room: true },
    });

    return res.json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
}
