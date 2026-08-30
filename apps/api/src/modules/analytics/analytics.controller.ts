import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/prisma';
import { withTenantScope } from '../../middleware/tenantScope';

export async function getAnalyticsSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const pgId = req.user!.pgId;
    if (!pgId) {
      return res.status(400).json({ error: { code: 'NO_PG_LINKED', message: 'User is not linked to any PG' } });
    }

    const where = withTenantScope({}, pgId);

    const grievances = await prisma.grievance.findMany({
      where,
      select: {
        id: true,
        category: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    const statusCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    const categoryCounts = {
      MAINTENANCE: 0,
      FOOD: 0,
      CLEANLINESS: 0,
      SAFETY: 0,
      OTHER: 0,
    };

    let totalResolutionTimeHours = 0;
    let resolvedCount = 0;

    for (const g of grievances) {
      if (g.status in statusCounts) {
        statusCounts[g.status as keyof typeof statusCounts]++;
      }
      if (g.category in categoryCounts) {
        categoryCounts[g.category as keyof typeof categoryCounts]++;
      }

      if (g.resolvedAt) {
        const durationHours = (new Date(g.resolvedAt).getTime() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60);
        totalResolutionTimeHours += durationHours;
        resolvedCount++;
      }
    }

    const avgResolutionTimeHours = resolvedCount > 0 ? parseFloat((totalResolutionTimeHours / resolvedCount).toFixed(1)) : 0;

    const totalCount = grievances.length;

    return res.json({
      summary: {
        totalCount,
        statusCounts,
        categoryCounts,
        avgResolutionTimeHours,
        resolvedCount,
      },
    });
  } catch (err) {
    next(err);
  }
}
