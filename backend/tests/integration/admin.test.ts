import { beforeAll, afterAll, describe, expect, it, request, suite, DB_READY } from './helpers.js';
import { prisma } from '../../src/lib/prisma.js';
import { bearer, createCompany, createJob, createUser } from './helpers.js';

const s = suite();

describe.skipIf(!DB_READY)('Admin API (moderation, stats, verification)', () => {
  let adminToken: string;
  let companyToken: string;
  let candidateToken: string;
  let company: Awaited<ReturnType<typeof createCompany>>;
  let pendingJob: Awaited<ReturnType<typeof createJob>>;

  beforeAll(async () => {
    await s.beforeAll();

    const admin = await createUser('admin@test.dev', { role: 'ADMIN' });
    const owner = await createUser('owner@test.dev', { role: 'COMPANY' });
    const seeker = await createUser('seeker@test.dev');
    adminToken = admin.token;
    companyToken = owner.token;
    candidateToken = seeker.token;
    company = await createCompany(owner.user, 'Modest Co');
    pendingJob = await createJob(company, { title: 'Needs Review', status: 'PENDING_REVIEW' });
    await createJob(company, { title: 'Live Role', status: 'APPROVED' });
  });
  afterAll(s.afterAll.bind(s));

  it('requires an authenticated admin', async () => {
    expect((await request(s.app).get('/api/admin/jobs')).status).toBe(401);
    expect((await request(s.app).get('/api/admin/jobs').set(bearer(candidateToken))).status).toBe(403);
  });

  it('lists every status by default and can filter by status', async () => {
    const all = await request(s.app).get('/api/admin/jobs').set(bearer(adminToken));
    expect(all.body.meta.total).toBe(2);

    const pending = await request(s.app)
      .get('/api/admin/jobs')
      .query({ status: 'PENDING_REVIEW' })
      .set(bearer(adminToken));
    expect(pending.body.data.map((j: { title: string }) => j.title)).toEqual(['Needs Review']);
  });

  it('supports the moderation workflow: approve, hide, flag', async () => {
    const approved = await request(s.app)
      .patch(`/api/admin/jobs/${pendingJob.id}/status`)
      .set(bearer(adminToken))
      .send({ status: 'APPROVED' });
    expect(approved.status).toBe(200);
    expect((await request(s.app).get('/api/jobs')).body.meta.total).toBe(2); // now public

    const hidden = await request(s.app)
      .patch(`/api/admin/jobs/${pendingJob.id}/status`)
      .set(bearer(adminToken))
      .send({ status: 'HIDDEN' });
    expect(hidden.status).toBe(200);
    expect((await request(s.app).get('/api/jobs')).body.meta.total).toBe(1); // removed from board

    const flagged = await request(s.app)
      .patch(`/api/admin/jobs/${pendingJob.id}/flag`)
      .set(bearer(adminToken))
      .send({ flagged: true });
    expect(flagged.status).toBe(200);
    expect(flagged.body.job.flagged).toBe(true);
  });

  it('rejects invalid status transitions payloads', async () => {
    const res = await request(s.app)
      .patch(`/api/admin/jobs/${pendingJob.id}/status`)
      .set(bearer(adminToken))
      .send({ status: 'NOT_A_STATUS' });
    expect(res.status).toBe(400);
  });

  it('reports moderation stats', async () => {
    const res = await request(s.app).get('/api/admin/stats').set(bearer(adminToken));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      jobs: { pendingReview: 0, approved: 1, hidden: 1 },
      companies: 1,
      users: 3,
      applications: 0,
    });
  });

  it('can verify a company', async () => {
    const res = await request(s.app)
      .patch(`/api/admin/companies/${company.id}/verified`)
      .set(bearer(adminToken))
      .send({ verified: true });
    expect(res.status).toBe(200);
    expect(res.body.company.verified).toBe(true);
    expect((await prisma.company.findUniqueOrThrow({ where: { id: company.id } })).verified).toBe(true);
  });
});
