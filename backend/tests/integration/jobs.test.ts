import { beforeAll, afterAll, describe, expect, it, request, suite, DB_READY } from './helpers.js';
import { prisma } from '../../src/lib/prisma.js';
import { createCompany, createJob, createUser } from './helpers.js';

const s = suite();

describe.skipIf(!DB_READY)('Jobs API (public board, CRUD, applications)', () => {
  let companyAToken: string;
  let companyBToken: string;
  let candidateToken: string;
  let companyA: Awaited<ReturnType<typeof createCompany>>;
  let companyB: Awaited<ReturnType<typeof createCompany>>;
  let j1: Awaited<ReturnType<typeof createJob>>; // approved, remote, react
  let j2: Awaited<ReturnType<typeof createJob>>; // approved, onsite, berlin, python
  let j3: Awaited<ReturnType<typeof createJob>>; // approved, hybrid, react native
  let j4: Awaited<ReturnType<typeof createJob>>; // pending (not public)
  let j5: Awaited<ReturnType<typeof createJob>>; // hidden (not public)
  let j6: Awaited<ReturnType<typeof createJob>>; // approved, other company, top salary

  beforeAll(async () => {
    await s.beforeAll();

    const a = await createUser('owner-a@test.dev', { name: 'Owner A', role: 'COMPANY' });
    const b = await createUser('owner-b@test.dev', { name: 'Owner B', role: 'COMPANY' });
    const c = await createUser('seeker@test.dev', { name: 'Seeker' });
    const admin = await createUser('admin@test.dev', { name: 'Admin', role: 'ADMIN' });
    companyAToken = a.token;
    companyBToken = b.token;
    candidateToken = c.token;

    companyA = await createCompany(a.user, 'Alpha Co');
    companyB = await createCompany(b.user, 'Beta Co');
    void admin;

    j1 = await createJob(companyA, {
      title: 'Senior React Engineer',
      workplace: 'REMOTE',
      salaryMin: 100_000,
      salaryMax: 150_000,
      status: 'APPROVED',
      daysAgo: 1,
      tags: ['react', 'typescript'],
    });
    j2 = await createJob(companyA, {
      title: 'Python Backend Developer',
      description: 'Zephyr pipeline team — we are looking for an experienced engineer to join us.',
      location: 'Berlin, Germany',
      workplace: 'ONSITE',
      salaryMin: 50_000,
      salaryMax: 80_000,
      status: 'APPROVED',
      daysAgo: 3,
      tags: ['python'],
    });
    j3 = await createJob(companyA, {
      title: 'React Native Mobile Engineer',
      workplace: 'HYBRID',
      salaryMin: 120_000,
      salaryMax: 180_000,
      status: 'APPROVED',
      daysAgo: 2,
      tags: ['react-native'],
    });
    j4 = await createJob(companyA, { title: 'Pending Job', status: 'PENDING_REVIEW', daysAgo: 4 });
    j5 = await createJob(companyA, { title: 'Hidden Job', status: 'HIDDEN', daysAgo: 5 });
    j6 = await createJob(companyB, {
      title: 'Rust Systems Engineer',
      workplace: 'REMOTE',
      salaryMin: 200_000,
      salaryMax: 300_000,
      status: 'APPROVED',
      daysAgo: 0,
      tags: ['rust'],
    });
  });
  afterAll(s.afterAll.bind(s));

  // --- Public board --------------------------------------------------------

  it('lists only APPROVED jobs, newest first', async () => {
    const res = await request(s.app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(4);
    expect(res.body.data.map((j: { title: string }) => j.title)).toEqual([
      'Rust Systems Engineer',
      'Senior React Engineer',
      'React Native Mobile Engineer',
      'Python Backend Developer',
    ]);
  });

  it('searches keyword across title, description and company name', async () => {
    // Substring (ILIKE) matching — multi-word queries are phrase matches;
    // token-level search is a documented upgrade path (tsvector).
    const byTitle = await request(s.app).get('/api/jobs').query({ q: 'react' });
    expect(byTitle.body.data.map((j: { title: string }) => j.title)).toEqual([
      'Senior React Engineer',
      'React Native Mobile Engineer',
    ]);

    const byDescription = await request(s.app).get('/api/jobs').query({ q: 'zephyr' });
    expect(byDescription.body.data.map((j: { title: string }) => j.title)).toEqual([
      'Python Backend Developer',
    ]);

    const byCompany = await request(s.app).get('/api/jobs').query({ q: 'beta' });
    expect(byCompany.body.data.map((j: { title: string }) => j.title)).toEqual([
      'Rust Systems Engineer',
    ]);
  });

  it('filters by location and workplace type', async () => {
    const berlin = await request(s.app).get('/api/jobs').query({ location: 'berlin' });
    expect(berlin.body.data.map((j: { title: string }) => j.title)).toEqual(['Python Backend Developer']);

    const remote = await request(s.app).get('/api/jobs').query({ workplace: 'REMOTE' });
    expect(remote.body.meta.total).toBe(2);
  });

  it('filters by salary range overlap', async () => {
    const min = await request(s.app).get('/api/jobs').query({ salaryMin: '190000' });
    expect(min.body.data.map((j: { title: string }) => j.title)).toEqual(['Rust Systems Engineer']);

    const max = await request(s.app).get('/api/jobs').query({ salaryMax: '90000' });
    expect(max.body.data.map((j: { title: string }) => j.title)).toEqual(['Python Backend Developer']);
  });

  it('filters by tags (comma-separated, any match)', async () => {
    const res = await request(s.app).get('/api/jobs').query({ tags: 'react,python' });
    expect(res.body.meta.total).toBe(2);
  });

  it('sorts by salary high and low with nulls last', async () => {
    const high = await request(s.app).get('/api/jobs').query({ sort: 'salary_high' });
    expect(high.body.data[0].title).toBe('Rust Systems Engineer');

    const low = await request(s.app).get('/api/jobs').query({ sort: 'salary_low' });
    expect(low.body.data[0].title).toBe('Python Backend Developer');
  });

  it('paginates with metadata', async () => {
    const page1 = await request(s.app).get('/api/jobs').query({ page: '1', pageSize: '2' });
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.meta).toEqual({ page: 1, pageSize: 2, total: 4, totalPages: 2 });

    const page2 = await request(s.app).get('/api/jobs').query({ page: '2', pageSize: '2' });
    expect(page2.body.data).toHaveLength(2);
  });

  it('serializes jobs with flattened tags and public company fields', async () => {
    const res = await request(s.app).get(`/api/jobs/${j1.id}`);
    expect(res.status).toBe(200);
    expect(res.body.job).toMatchObject({
      title: 'Senior React Engineer',
      tags: ['react', 'typescript'],
    });
    expect(res.body.job.company.name).toBe('Alpha Co');
    expect(res.body.job.company).not.toHaveProperty('userId');
  });

  it('hides non-approved jobs from the public but shows them to their owner', async () => {
    expect((await request(s.app).get(`/api/jobs/${j4.id}`)).status).toBe(404);
    expect((await request(s.app).get(`/api/jobs/${j4.id}`).set('Authorization', `Bearer ${companyAToken}`)).status).toBe(200);
  });

  it('404s on unknown ids', async () => {
    expect((await request(s.app).get('/api/jobs/does-not-exist')).status).toBe(404);
  });

  // --- Company CRUD ----------------------------------------------------------

  it('creates a job as a company user (goes to PENDING_REVIEW)', async () => {
    const res = await request(s.app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${companyBToken}`)
      .send({
        title: 'New Backend Role',
        description: 'A brand new role with a description longer than thirty characters.',
        location: 'Remote',
        workplace: 'REMOTE',
        salaryMin: 100,
        salaryMax: 200,
        applyUrl: 'https://beta.example.com/apply',
        tags: [' Go ', 'go', 'Kubernetes'],
      });
    expect(res.status).toBe(201);
    expect(res.body.job.status).toBe('PENDING_REVIEW');
    // tags are normalized (deduped + lowercased)
    expect(res.body.job.tags).toEqual(['go', 'kubernetes']);
  });

  it('blocks job creation for non-company users and anonymous callers', async () => {
    const res = await request(s.app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({
        title: 'Sneaky Job',
        description: 'A description that is definitely long enough to pass validation.',
        location: 'Remote',
        applyUrl: 'https://example.com/apply',
      });
    expect(res.status).toBe(403);
    expect((await request(s.app).post('/api/jobs').send({})).status).toBe(401);
  });

  it('validates the job payload with 400 + field errors', async () => {
    const res = await request(s.app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${companyBToken}`)
      .send({ title: 'x', description: 'short', location: '', applyUrl: 'nope' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.details)).toEqual(
      expect.arrayContaining(['title', 'description', 'location', 'applyUrl']),
    );
  });

  it("prevents editing another company's job", async () => {
    const res = await request(s.app)
      .patch(`/api/jobs/${j1.id}`)
      .set('Authorization', `Bearer ${companyBToken}`)
      .send({ title: 'Hacked Title' });
    expect(res.status).toBe(404);
  });

  it('lets the owner edit; edits re-submit the job for review', async () => {
    const res = await request(s.app)
      .patch(`/api/jobs/${j1.id}`)
      .set('Authorization', `Bearer ${companyAToken}`)
      .send({ title: 'Senior React Engineer (Updated)' });
    expect(res.status).toBe(200);
    expect(res.body.job.title).toBe('Senior React Engineer (Updated)');
    expect(res.body.job.status).toBe('PENDING_REVIEW');

    // Put it back to approved for later tests.
    await prisma.job.update({ where: { id: j1.id }, data: { status: 'APPROVED' } });
  });

  it('lets the owner delete their job', async () => {
    const created = await request(s.app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${companyBToken}`)
      .send({
        title: 'Doomed Role',
        description: 'This role will be deleted in a moment by its owner.',
        location: 'Remote',
        applyUrl: 'https://beta.example.com/apply',
      });
    const res = await request(s.app)
      .delete(`/api/jobs/${created.body.job.id}`)
      .set('Authorization', `Bearer ${companyBToken}`);
    expect(res.status).toBe(204);
    expect(await prisma.job.findUnique({ where: { id: created.body.job.id } })).toBeNull();
  });

  // --- Applications ----------------------------------------------------------

  it('lets a candidate apply to an approved job, once', async () => {
    const first = await request(s.app)
      .post(`/api/jobs/${j1.id}/applications`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ coverLetter: 'I have five years of React experience and would love to join Alpha Co.' });
    expect(first.status).toBe(201);

    const duplicate = await request(s.app)
      .post(`/api/jobs/${j1.id}/applications`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ coverLetter: 'Applying again with a slightly different cover letter text.' });
    expect(duplicate.status).toBe(409);
  });

  it('blocks applying to your own job and to non-approved jobs', async () => {
    expect(
      (
        await request(s.app)
          .post(`/api/jobs/${j1.id}/applications`)
          .set('Authorization', `Bearer ${companyAToken}`)
          .send({ coverLetter: 'The owner trying to apply to their own job posting here.' })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(s.app)
          .post(`/api/jobs/${j4.id}/applications`)
          .set('Authorization', `Bearer ${candidateToken}`)
          .send({ coverLetter: 'Trying to apply to a pending job that is not public yet.' })
      ).status,
    ).toBe(404);
  });

  it("shows applications to the hiring company and lets them update status", async () => {
    const list = await request(s.app)
      .get('/api/companies/me/applications')
      .set('Authorization', `Bearer ${companyAToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ job: { title: 'Senior React Engineer (Updated)' } });

    const updated = await request(s.app)
      .patch(`/api/companies/applications/${list.body.data[0].id}`)
      .set('Authorization', `Bearer ${companyAToken}`)
      .send({ status: 'REVIEWING' });
    expect(updated.status).toBe(200);
    expect(updated.body.application.status).toBe('REVIEWING');
  });

  it("lists a company's own jobs across statuses with application counts", async () => {
    const res = await request(s.app)
      .get('/api/companies/me/jobs')
      .set('Authorization', `Bearer ${companyAToken}`);
    expect(res.body.data).toHaveLength(5); // j1..j5 across approved/pending/hidden
    expect(res.body.data[0]).toHaveProperty('applicationCount');
  });

  it('serves a public company page with only approved jobs', async () => {
    const res = await request(s.app).get(`/api/companies/${companyA.id}`);
    expect(res.status).toBe(200);
    expect(res.body.company.name).toBe('Alpha Co');
    expect(res.body.jobs).toHaveLength(3); // j1, j2, j3 — not j4/j5
  });
});
