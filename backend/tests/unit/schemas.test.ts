import { describe, expect, it } from 'vitest';
import { registerSchema, loginSchema } from '../../src/modules/auth/schemas.js';
import {
  applicationSchema,
  jobCreateSchema,
  jobQuerySchema,
} from '../../src/modules/jobs/schemas.js';
import { companySchema } from '../../src/modules/companies/schemas.js';

const validJob = {
  title: 'Senior Engineer',
  description: 'A description that is definitely longer than thirty characters.',
  location: 'Remote',
  applyUrl: 'https://example.com/apply',
};

describe('registerSchema', () => {
  it('defaults to the USER role and lowercases the email', () => {
    const parsed = registerSchema.parse({ name: 'Ann', email: 'ANN@Example.COM', password: 'longenough1' });
    expect(parsed).toMatchObject({ email: 'ann@example.com', role: 'USER' });
  });

  it('rejects short passwords and bad emails', () => {
    expect(registerSchema.safeParse({ name: 'Ann', email: 'a@b.co', password: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'Ann', email: 'not-an-email', password: 'longenough1' }).success).toBe(false);
  });

  it('never accepts the ADMIN role from the API', () => {
    const result = registerSchema.safeParse({ name: 'Ann', email: 'a@b.co', password: 'longenough1', role: 'ADMIN' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires both fields', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co' }).success).toBe(false);
  });
});

describe('jobCreateSchema', () => {
  it('accepts a valid job and defaults workplace/currency/tags', () => {
    const parsed = jobCreateSchema.parse(validJob);
    expect(parsed).toMatchObject({ workplace: 'ONSITE', currency: 'USD', tags: [] });
  });

  it('rejects salaryMax below salaryMin', () => {
    const result = jobCreateSchema.safeParse({ ...validJob, salaryMin: 100, salaryMax: 50 });
    expect(result.success).toBe(false);
  });

  it('rejects short descriptions and bad URLs', () => {
    expect(jobCreateSchema.safeParse({ ...validJob, description: 'too short' }).success).toBe(false);
    expect(jobCreateSchema.safeParse({ ...validJob, applyUrl: 'not a url' }).success).toBe(false);
  });
});

describe('jobQuerySchema', () => {
  it('coerces page/pageSize from strings with defaults', () => {
    const parsed = jobQuerySchema.parse({ page: '3' });
    expect(parsed).toMatchObject({ page: 3, pageSize: 10, sort: 'newest' });
  });

  it('treats empty-string filters as absent', () => {
    const parsed = jobQuerySchema.parse({ q: '', workplace: '', salaryMin: '' });
    expect(parsed.q).toBeUndefined();
    expect(parsed.workplace).toBeUndefined();
    expect(parsed.salaryMin).toBeUndefined();
  });

  it('rejects unknown sort options and workplace values', () => {
    expect(jobQuerySchema.safeParse({ sort: 'random' }).success).toBe(false);
    expect(jobQuerySchema.safeParse({ workplace: 'CAFES' }).success).toBe(false);
  });
});

describe('applicationSchema', () => {
  it('requires a substantial cover letter', () => {
    expect(applicationSchema.safeParse({ coverLetter: 'too short' }).success).toBe(false);
    expect(
      applicationSchema.safeParse({ coverLetter: 'This is a cover letter that is long enough to pass.' }).success,
    ).toBe(true);
  });
});

describe('companySchema', () => {
  it('accepts blank optional fields but not malformed URLs', () => {
    expect(companySchema.safeParse({ name: 'Acme', website: '', logoUrl: '' }).success).toBe(true);
    expect(companySchema.safeParse({ name: 'Acme', website: 'nope' }).success).toBe(false);
  });
});
