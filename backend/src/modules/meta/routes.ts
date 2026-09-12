import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

/** GET /api/stats — public headline numbers for the landing page. */
router.get('/stats', async (_req, res) => {
  const [jobs, companies] = await Promise.all([
    prisma.job.count({ where: { status: 'APPROVED' } }),
    prisma.company.count({ where: { jobs: { some: { status: 'APPROVED' } } } }),
  ]);
  res.json({ jobs, companies });
});

/** GET /api/tags — most-used tags on approved jobs (for the landing page + filter shortcuts). */
router.get('/tags', async (_req, res) => {
  const counts = await prisma.jobTag.groupBy({
    by: ['tagId'],
    where: { job: { status: 'APPROVED' } },
    _count: { _all: true },
    orderBy: { _count: { tagId: 'desc' } },
    take: 18,
  });

  const tags = await prisma.tag.findMany({
    where: { id: { in: counts.map((c) => c.tagId) } },
    select: { id: true, name: true },
  });
  const countByName = new Map(counts.map((c) => [c.tagId, c._count._all]));

  res.json({
    data: tags
      .map((t) => ({ name: t.name, count: countByName.get(t.id) ?? 0 }))
      .sort((a, b) => b.count - a.count),
  });
});

export default router;
