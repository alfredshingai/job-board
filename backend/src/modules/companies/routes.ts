import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { ApiError } from '../../utils/errors.js';
import { serializeJob } from '../../utils/serialize.js';
import { z } from 'zod';
import { JOB_INCLUDE } from '../jobs/service.js';
import { param } from '../../utils/params.js';
import { companySchema } from './schemas.js';

const router = Router();

/** Fields every company API response exposes. */
const COMPANY_SELECT = {
  id: true,
  name: true,
  website: true,
  logoUrl: true,
  description: true,
  location: true,
  verified: true,
} as const;

/** Loads the company profile owned by the logged-in COMPANY user (or throws). */
async function myCompany(userId: string) {
  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) {
    throw ApiError.badRequest('Create your company profile first');
  }
  return company;
}

/** GET /api/companies/me — the recruiter's own profile (null if not created yet). */
router.get('/me', requireAuth, requireRole('COMPANY'), async (req, res) => {
  const company = await prisma.company.findUnique({ where: { userId: req.user!.id } });
  res.json({ company });
});

/** POST /api/companies/me — create the recruiter's company profile (once). */
router.post('/me', requireAuth, requireRole('COMPANY'), validate('body', companySchema), async (req, res) => {
  const existing = await prisma.company.findUnique({ where: { userId: req.user!.id } });
  if (existing) throw ApiError.conflict('You already have a company profile');

  const company = await prisma.company.create({
    data: { ...req.body, userId: req.user!.id },
  });
  res.status(201).json({ company });
});

/** PATCH /api/companies/me — update the recruiter's company profile. */
router.patch('/me', requireAuth, requireRole('COMPANY'), validate('body', companySchema.partial()), async (req, res) => {
  const company = await myCompany(req.user!.id);
  const updated = await prisma.company.update({ where: { id: company.id }, data: req.body });
  res.json({ company: updated });
});

/** GET /api/companies/me/jobs — all of the recruiter's postings, any status. */
router.get('/me/jobs', requireAuth, requireRole('COMPANY'), async (req, res) => {
  const company = await myCompany(req.user!.id);
  const jobs = await prisma.job.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: 'desc' },
    include: { ...JOB_INCLUDE, _count: { select: { applications: true } } },
  });
  res.json({
    data: jobs.map((job) => ({ ...serializeJob(job), applicationCount: job._count.applications })),
  });
});

/** GET /api/companies/me/applications — candidates who applied to my jobs. */
router.get('/me/applications', requireAuth, requireRole('COMPANY'), async (req, res) => {
  const company = await myCompany(req.user!.id);
  const applications = await prisma.application.findMany({
    where: { job: { companyId: company.id } },
    orderBy: { createdAt: 'desc' },
    include: {
      job: { select: { id: true, title: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  res.json({ data: applications });
});

/** PATCH /api/companies/applications/:id — move an application through the pipeline. */
router.patch(
  '/applications/:id',
  requireAuth,
  requireRole('COMPANY'),
  validate('body', z.object({ status: z.enum(['SUBMITTED', 'REVIEWING', 'REJECTED', 'HIRED']) })),
  async (req, res) => {
    const company = await myCompany(req.user!.id);
    const application = await prisma.application.findUnique({
      where: { id: param(req, 'id') },
      include: { job: { select: { companyId: true } } },
    });
    if (!application) throw ApiError.notFound('Application not found');
    if (application.job.companyId !== company.id) throw ApiError.forbidden();

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: req.body.status },
    });
    res.json({ application: updated });
  },
);

/**
 * GET /api/companies/:id — public company page: profile + approved openings.
 * Registered last so `/me` and `/applications` are not captured as an `:id`.
 */
router.get('/:id', async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { id: param(req, 'id') },
    select: {
      ...COMPANY_SELECT,
      jobs: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        include: JOB_INCLUDE,
      },
    },
  });
  if (!company) throw ApiError.notFound('Company not found');

  const { jobs, ...profile } = company;
  res.json({ company: profile, jobs: jobs.map(serializeJob) });
});

export default router;
