import { z } from 'zod';
import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { serializeJob } from '../../utils/serialize.js';
import { param } from '../../utils/params.js';
import { JOB_INCLUDE, listJobs } from '../jobs/service.js';
import { jobQuerySchema } from '../jobs/schemas.js';

const router = Router();

// Every admin route requires an authenticated ADMIN.
router.use(requireAuth, requireRole('ADMIN'));

/** PATCH /api/admin/jobs/:id/status — approve, reject or hide a posting. */
const statusSchema = z.object({
  status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN']),
});
router.patch('/jobs/:id/status', validate('body', statusSchema), async (req, res) => {
  const job = await prisma.job.update({
    where: { id: param(req, 'id') },
    data: { status: req.body.status },
    include: JOB_INCLUDE,
  });
  res.json({ job: serializeJob(job) });
});

/** PATCH /api/admin/jobs/:id/flag — mark/unmark a posting as spam. */
const flagSchema = z.object({ flagged: z.boolean() });
router.patch('/jobs/:id/flag', validate('body', flagSchema), async (req, res) => {
  const job = await prisma.job.update({
    where: { id: param(req, 'id') },
    data: { flagged: req.body.flagged },
    include: JOB_INCLUDE,
  });
  res.json({ job: serializeJob(job) });
});

/**
 * GET /api/admin/jobs — moderation queue with the same search/filter/pagination
 * as the public board, but across every status. `?status=` narrows it down.
 */
const adminJobQuerySchema = jobQuerySchema.extend({
  status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN']).optional(),
});

router.get('/jobs', validate('query', adminJobQuerySchema), async (req, res) => {
  // validate() parsed and replaced req.query — retype it for the service call.
  const { status, ...query } = req.query as unknown as z.infer<typeof adminJobQuerySchema>;
  // No ?status= filter means every status (the public board's APPROVED-only
  // default must not leak into the moderation queue).
  const statuses = status
    ? [status]
    : (['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN'] as const);
  const result = await listJobs(query, { statuses: [...statuses] });
  res.json(result);
});

/** GET /api/admin/stats — headline numbers for the admin overview. */
router.get('/stats', async (_req, res) => {
  const [byStatus, companies, users, applications] = await Promise.all([
    prisma.job.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.company.count(),
    prisma.user.count(),
    prisma.application.count(),
  ]);

  const jobs = Object.fromEntries(byStatus.map((row) => [row.status, row._count._all]));
  res.json({
    jobs: {
      pendingReview: jobs.PENDING_REVIEW ?? 0,
      approved: jobs.APPROVED ?? 0,
      rejected: jobs.REJECTED ?? 0,
      hidden: jobs.HIDDEN ?? 0,
    },
    companies,
    users,
    applications,
  });
});

/** PATCH /api/admin/companies/:id/verified — grant/revoke the verified badge. */
const verifiedSchema = z.object({ verified: z.boolean() });
router.patch('/companies/:id/verified', validate('body', verifiedSchema), async (req, res) => {
  const company = await prisma.company.update({
    where: { id: param(req, 'id') },
    data: { verified: req.body.verified },
  });
  res.json({ company });
});

export default router;
