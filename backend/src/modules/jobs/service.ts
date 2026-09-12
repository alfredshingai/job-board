import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/errors.js';
import { normalizeTags, serializeJob } from '../../utils/serialize.js';
import { paginate, skipTake, type Paginated } from '../../utils/pagination.js';
import type { JobQuery } from './schemas.js';

/** Prisma include used for every job response (company + tag rows). */
export const JOB_INCLUDE = {
  company: {
    select: { id: true, name: true, logoUrl: true, website: true, verified: true },
  },
  tags: { include: { tag: true } },
} satisfies Prisma.JobInclude;

const ORDER_BY: Record<JobQuery['sort'], Prisma.JobOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  // Nulls last so jobs without a salary never float to the top.
  salary_high: [{ salaryMax: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
  salary_low: [{ salaryMin: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
};

export type ListJobsOptions = {
  /** Restrict to these statuses; defaults to APPROVED only (public board). */
  statuses?: Prisma.EnumJobStatusFilter['in'];
  /** Restrict to one company (e.g. public company page). */
  companyId?: string;
};

/**
 * Builds the Prisma `where` clause for the job list from query params:
 * keyword (title/description/company), location, workplace type, salary-range
 * overlap and tags.
 *
 * Salary filter semantics: a job matches when its range overlaps the
 * requested range (job.salaryMax >= min AND job.salaryMin <= max).
 */
function buildWhere(query: JobQuery, options: ListJobsOptions): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = {
    status: options.statuses ? { in: options.statuses } : 'APPROVED',
  };

  if (options.companyId) where.companyId = options.companyId;

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { company: { is: { name: { contains: query.q, mode: 'insensitive' } } } },
    ];
  }

  if (query.location) where.location = { contains: query.location, mode: 'insensitive' };
  if (query.workplace) where.workplace = query.workplace;
  if (query.salaryMin !== undefined) where.salaryMax = { gte: query.salaryMin };
  if (query.salaryMax !== undefined) where.salaryMin = { lte: query.salaryMax };

  const tagNames = query.tags
    ? normalizeTags(query.tags.split(','))
    : [];
  if (tagNames.length > 0) {
    where.tags = { some: { tag: { name: { in: tagNames } } } };
  }

  return where;
}

/** Paginated, sorted, filtered job list — the heart of the public board. */
export async function listJobs(
  query: JobQuery,
  options: ListJobsOptions = {},
): Promise<Paginated<ReturnType<typeof serializeJob>>> {
  const where = buildWhere(query, options);

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: ORDER_BY[query.sort],
      ...skipTake(query),
      include: JOB_INCLUDE,
    }),
    prisma.job.count({ where }),
  ]);

  return paginate(jobs.map(serializeJob), total, query);
}

/** Loads a job for the detail page. Non-APPROVED jobs are only visible to their owner or an admin (otherwise 404, to avoid leaking existence). */
export async function getJobById(
  id: string,
  viewer?: { id: string; role: string },
) {
  const job = await prisma.job.findUnique({ where: { id }, include: JOB_INCLUDE });
  if (!job) throw ApiError.notFound('Job not found');

  if (job.status !== 'APPROVED') {
    const allowed = viewer && (viewer.role === 'ADMIN' || (await ownsJob(viewer.id, job.id)));
    if (!allowed) throw ApiError.notFound('Job not found');
  }

  return serializeJob(job);
}

/** True when the given user owns the company that posted the job. */
export async function ownsJob(userId: string, jobId: string): Promise<boolean> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { company: { select: { userId: true } } },
  });
  return job?.company.userId === userId;
}

/** Creates the tag rows (idempotent) and links them to a job. */
function tagRows(tagNames: string[]) {
  return normalizeTags(tagNames).map((name) => ({
    tag: { connectOrCreate: { where: { name }, create: { name } } },
  }));
}

/** Nested tag write for job *creation*. */
export function tagLinksCreate(tagNames: string[]) {
  return { create: tagRows(tagNames) };
}

/** Nested tag write for job *updates* — drops the old links, then re-links. */
export function tagLinksReplace(tagNames: string[]) {
  return { deleteMany: {}, create: tagRows(tagNames) };
}

/** Loads the COMPANY user's own company profile, or throws a helpful 400. */
export async function requireCompanyProfile(userId: string) {
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) {
    throw ApiError.badRequest('Create your company profile before posting jobs');
  }
  return company;
}
