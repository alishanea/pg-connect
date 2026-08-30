import { Role } from '../types/enums';

export interface UserPayload {
  userId: string;
  email: string;
  role: Role | string;
  pgId: string | null;
  roomId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Utility to merge a tenant pgId filter condition into any Prisma query condition object.
 * Guaranteed to enforce strict single-tenant boundary isolation.
 */
export function withTenantScope<T extends Record<string, any>>(
  whereClause: T,
  pgId: string | null | undefined
): T & { pgId: string } {
  if (!pgId) {
    throw new Error('TENANT_SCOPE_VIOLATION: User has no assigned PG property ID');
  }

  return {
    ...whereClause,
    pgId,
  };
}
