import { beforeAll, afterAll, describe, expect, it, request, suite, DB_READY } from './helpers.js';

const s = suite();

describe.skipIf(!DB_READY)('Auth API', () => {
  beforeAll(s.beforeAll.bind(s));
  afterAll(s.afterAll.bind(s));

  it('registers a new job seeker (default role USER)', async () => {
    const res = await request(s.app)
      .post('/api/auth/register')
      .send({ name: 'Casey Candidate', email: 'casey@example.com', password: 'supersecret1' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'casey@example.com', role: 'USER' });
    expect(res.body.token).toBeTruthy();
  });

  it('registers a company account with role COMPANY', async () => {
    const res = await request(s.app)
      .post('/api/auth/register')
      .send({ name: 'Acme Recruiter', email: 'acme@example.com', password: 'supersecret1', role: 'COMPANY' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('COMPANY');
  });

  it('rejects duplicate emails with 409', async () => {
    const res = await request(s.app)
      .post('/api/auth/register')
      .send({ name: 'Casey Again', email: 'casey@example.com', password: 'supersecret1' });
    expect(res.status).toBe(409);
  });

  it('rejects invalid payloads with 400 and field errors', async () => {
    const res = await request(s.app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty('password');
  });

  it('logs in with correct credentials', async () => {
    const res = await request(s.app)
      .post('/api/auth/login')
      .send({ email: 'casey@example.com', password: 'supersecret1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('casey@example.com');
  });

  it('rejects wrong password with 401 (no account enumeration)', async () => {
    const res = await request(s.app)
      .post('/api/auth/login')
      .send({ email: 'casey@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('returns the current user for GET /me', async () => {
    const login = await request(s.app)
      .post('/api/auth/login')
      .send({ email: 'casey@example.com', password: 'supersecret1' });

    const res = await request(s.app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('casey@example.com');
  });

  it('protects /me: 401 without and with a garbage token', async () => {
    expect((await request(s.app).get('/api/auth/me')).status).toBe(401);
    expect(
      (await request(s.app).get('/api/auth/me').set('Authorization', 'Bearer garbage')).status,
    ).toBe(401);
  });
});
