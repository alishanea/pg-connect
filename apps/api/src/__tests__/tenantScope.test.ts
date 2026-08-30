import { describe, it, expect } from 'vitest';
import { withTenantScope } from '../middleware/tenantScope';

describe('withTenantScope Utility', () => {
  it('attaches pgId to empty where clause', () => {
    const result = withTenantScope({}, 'pg-123');
    expect(result).toEqual({ pgId: 'pg-123' });
  });

  it('preserves existing query parameters', () => {
    const result = withTenantScope({ status: 'OPEN', category: 'FOOD' }, 'pg-456');
    expect(result).toEqual({
      status: 'OPEN',
      category: 'FOOD',
      pgId: 'pg-456',
    });
  });

  it('throws TENANT_SCOPE_VIOLATION error if pgId is null or undefined', () => {
    expect(() => withTenantScope({}, null)).toThrowError(/TENANT_SCOPE_VIOLATION/);
    expect(() => withTenantScope({}, undefined)).toThrowError(/TENANT_SCOPE_VIOLATION/);
  });
});
