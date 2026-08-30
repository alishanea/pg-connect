import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { Role } from '../../types/enums';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-pg-connect-jwt-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'super-secret-pg-connect-refresh-key';

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  inviteCode: z.string().optional(),
  pgName: z.string().optional(),
  pgAddress: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateTokens(user: { id: string; email: string; role: Role | string; pgId: string | null; roomId?: string | null }) {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      pgId: user.pgId,
      roomId: user.roomId,
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const input = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: 'A user with this email already exists',
        },
      });
    }

    let role: Role = Role.RESIDENT;
    let pgId: string | null = null;

    if (input.inviteCode) {
      const invite = await prisma.inviteCode.findUnique({
        where: { code: input.inviteCode },
      });

      if (!invite || invite.used) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INVITE_CODE',
            message: 'Invite code is invalid or has already been used',
          },
        });
      }

      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return res.status(400).json({
          error: {
            code: 'EXPIRED_INVITE_CODE',
            message: 'Invite code has expired',
          },
        });
      }

      role = invite.roleGranted as Role;
      pgId = invite.pgId;

      await prisma.inviteCode.update({
        where: { id: invite.id },
        data: { used: true },
      });
    } else {
      // Admin self-registration flow
      role = Role.ADMIN;
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role,
        pgId,
      },
    });

    // If admin provided PG details on signup, auto-create the PG
    if (role === Role.ADMIN && input.pgName && input.pgAddress) {
      const newPg = await prisma.pG.create({
        data: {
          name: input.pgName,
          address: input.pgAddress,
          ownerId: newUser.id,
        },
      });

      await prisma.user.update({
        where: { id: newUser.id },
        data: { pgId: newPg.id },
      });

      pgId = newPg.id;
      newUser.pgId = newPg.id;
    }

    const tokens = generateTokens({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      pgId,
      roomId: newUser.roomId,
    });

    return res.status(201).json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        pgId,
        roomId: newUser.roomId,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      pgId: user.pgId,
      roomId: user.roomId,
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        pgId: user.pgId,
        roomId: user.roomId,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        pg: true,
        room: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        pgId: user.pgId,
        roomId: user.roomId,
        pg: user.pg ? { id: user.pg.id, name: user.pg.name, address: user.pg.address } : null,
        room: user.room ? { id: user.room.id, roomNumber: user.room.roomNumber, capacity: user.room.capacity } : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    if (!refreshToken) {
      return res.status(400).json({ error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token is required' } });
    }

    const decoded = jwt.verify(refreshToken as string, REFRESH_TOKEN_SECRET) as { userId: string; email: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'User not found' } });
    }

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      pgId: user.pgId,
      roomId: user.roomId,
    });

    return res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token expired or invalid' } });
  }
}
