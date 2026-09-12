import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { ApiError } from '../../utils/errors.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { signToken, toSafeUser } from '../../utils/jwt.js';
import { loginSchema, registerSchema } from './schemas.js';

const router = Router();

/** POST /api/auth/register — create a job-seeker (USER) or recruiter (COMPANY) account. */
router.post('/register', validate('body', registerSchema), async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role },
  });

  res.status(201).json({ user: toSafeUser(user), token: signToken(user.id) });
});

/** POST /api/auth/login — exchange email + password for a JWT. */
router.post('/login', validate('body', loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for unknown email and wrong password (no account enumeration).
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  res.json({ user: toSafeUser(user), token: signToken(user.id) });
});

/** GET /api/auth/me — the currently authenticated user. */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
