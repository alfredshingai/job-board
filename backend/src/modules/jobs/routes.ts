import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../middleware/validate.js';
import { optionalAuth, requireAuth, requireRole } from '../../middleware/auth.js';
import { ApiError } from '../../utils/errors.js';
import { param } from '../../utils/params.js';
import { serializeJob } from '../../utils/serialize.js';
import {
  JOB_INCLUDE,
  getJobById,
  listJobs,
  requireCompanyProfile,
  tagLinksCreate,
  tagLinksReplace,
  ownsJob,
} from './service.js';
import {
  applicationSchema,
  jobCreateSchema,
  jobQuerySchema,
  jobUpdateSchema,
  type JobQuery,
} from './schemas.js';

const router = Router();

/**
 * GET /api/jobs — the public board.
 * Query params: q, location, workplace, salaryMin, salaryMax, tags, sort, page, pageSize.
 * Only APPROVED jobs are returned.
 */
router.get('/', validate('query', jobQuerySchema), async (req, res) => {
  // validate() parsed and replaced req.query — retype it for the service call.
  const query = req.query as unknown as JobQuery;
  const result = await listJobs(query);
  res.json(result);
});

/**
 * GET /api/jobs/:id — public job detail.
 * Owners/admins can also preview their own pending/rejected/hidden jobs.
 */
router.get('/:id', optionalAuth, async (req, res) => {
  const job = await getJobById(param(req, 'id'), req.user);
  res.json({ job });
});

/** POST /api/jobs — recruiters submit a new posting (enters PENDING_REVIEW). */
router.post(
  '/',
  requireAuth,
  requireRole('COMPANY'),
  validate('body', jobCreateSchema),
  async (req, res) => {
    const company = await requireCompanyProfile(req.user!.id);

    const job = await prisma.job.create({
      data: {
        ...req.body,
        companyId: company.id,
        status: 'PENDING_REVIEW',
        tags: tagLinksCreate(req.body.tags),
      },
      include: JOB_INCLUDE,
    });

    res.status(201).json({ job: serializeJob(job) });
  },
);

/**
 * PATCH /api/jobs/:id — owner edits a posting.
 * Edits by the owner send the job back to PENDING_REVIEW for re-moderation;
 * admins keep the current status.
 */
router.patch(
  '/:id',
  requireAuth,
  validate('body', jobUpdateSchema),
  async (req, res) => {
    if (!(await ownsJob(req.user!.id, param(req, 'id'))) && req.user!.role !== 'ADMIN') {
      throw ApiError.notFound('Job not found');
    }

    const { tags, ...data } = req.body;
    const job = await prisma.job.update({
      where: { id: param(req, 'id') },
      data: {
        ...data,
        ...(tags !== undefined && { tags: tagLinksReplace(tags) }),
        ...(req.user!.role !== 'ADMIN' && { status: 'PENDING_REVIEW' }),
      },
      include: JOB_INCLUDE,
    });

    res.json({ job: serializeJob(job) });
  },
);

/** DELETE /api/jobs/:id — owner or admin removes a posting (and its applications). */
router.delete('/:id', requireAuth, async (req, res) => {
  if (!(await ownsJob(req.user!.id, param(req, 'id'))) && req.user!.role !== 'ADMIN') {
    throw ApiError.notFound('Job not found');
  }

  await prisma.job.delete({ where: { id: param(req, 'id') } });
  res.status(204).send();
});

/**
 * POST /api/jobs/:id/applications — in-app apply (authenticated users).
 * Companies can also apply elsewhere; applying to your own job is blocked.
 */
router.post(
  '/:id/applications',
  requireAuth,
  validate('body', applicationSchema),
  async (req, res) => {
    const job = await prisma.job.findUnique({
      where: { id: param(req, 'id') },
      select: { id: true, status: true, company: { select: { userId: true } } },
    });
    if (!job || job.status !== 'APPROVED') throw ApiError.notFound('Job not found');
    if (job.company.userId === req.user!.id) {
      throw ApiError.forbidden('You cannot apply to your own job');
    }

    const duplicate = await prisma.application.findFirst({
      where: { jobId: job.id, userId: req.user!.id },
    });
    if (duplicate) throw ApiError.conflict('You have already applied to this job');

    const application = await prisma.application.create({
      data: { ...req.body, jobId: job.id, userId: req.user!.id },
    });
    res.status(201).json({ application });
  },
);

export default router;
