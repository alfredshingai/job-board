import request from 'supertest';
import type { Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma.js';
import type { Company, User } from '@prisma/client';

/**
 * Integration suites hit the real HTTP layer against the throwaway test
 * database started by `tests/run-tests.mjs` (`npm test`).
 * Running plain `vitest` without that orchestrator safely skips these suites.
 */
export const DB_READY =
  !!process.env.DATABASE_URL && process.env.DATABASE_URL.includes('jobboard_test');

export async function resetDb() {
  // Order matters: children first, then the rows they point at.
  await prisma.application.deleteMany();
  await prisma.jobTag.deleteMany();
  await prisma.job.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function createApp() {
  const { createApp } = await import('../../src/app.js');
  return createApp();
}

type UserOverrides = { name?: string; role?: 'USER' | 'COMPANY' | 'ADMIN'; password?: string };

export async function createUser(email: string, overrides: UserOverrides = {}) {
  const { hashPassword } = await import('../../src/utils/password.js');
  const { signToken } = await import('../../src/utils/jwt.js');
  const user = await prisma.user.create({
    data: {
      email,
      name: overrides.name ?? 'Test User',
      role: overrides.role ?? 'USER',
      passwordHash: await hashPassword(overrides.password ?? 'password123'),
    },
  });
  return { user, token: signToken(user.id) };
}

export async function createCompany(user: User, name: string, verified = false): Promise<Company> {
  return prisma.company.create({
    data: {
      userId: user.id,
      name,
      website: `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example.com`,
      verified,
    },
  });
}

type JobOverrides = Partial<{
  title: string;
  description: string;
  location: string;
  workplace: 'ONSITE' | 'HYBRID' | 'REMOTE';
  salaryMin: number;
  salaryMax: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  daysAgo: number;
  tags: string[];
}>;

export async function createJob(company: Company, overrides: JobOverrides = {}) {
  const { tags, daysAgo, ...data } = overrides;
  return prisma.job.create({
    data: {
      companyId: company.id,
      title: 'Software Engineer',
      description: 'We are looking for an experienced engineer to join our growing platform team.',
      location: 'Test City',
      workplace: 'REMOTE',
      applyUrl: 'https://example.com/apply',
      ...data,
      createdAt: daysAgo !== undefined ? new Date(Date.now() - daysAgo * 86_400_000) : undefined,
      tags: tags && {
        create: tags.map((name) => ({
          tag: { connectOrCreate: { where: { name }, create: { name } } },
        })),
      },
    },
  });
}

/** Shared app instance created once per suite. */
export const suite = () => {
  let app: Express;
  return {
    get app() {
      return app;
    },
    async beforeAll() {
      app = await createApp();
      await resetDb();
    },
    afterAll() {
      return prisma.$disconnect();
    },
  };
};

export { describe, it, expect, beforeAll, afterAll };
export { request };
