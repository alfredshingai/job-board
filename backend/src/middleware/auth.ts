import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/errors.js';
import type { AuthUser } from '../types/express.js';

/**
 * Extracts a Bearer token, verifies it and loads the user from the database
 * (so deleted users and role changes take effect immediately).
 * Attaches the user to `req.user`.
 */
async function authenticate(req: Request, required: boolean): Promise<AuthUser | null> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    // No token at all: an error for protected routes, anonymous for optional ones.
    if (required) throw ApiError.unauthorized();
    return null;
  }

  let userId: string;
  try {
    ({ sub: userId } = verifyToken(header.slice('Bearer '.length)));
  } catch {
    // A malformed/expired token always 401s (optional routes catch and continue).
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized('User no longer exists');

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Rejects the request with 401 unless a valid token is presented. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = (await authenticate(req, true)) ?? undefined;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Tolerates missing tokens (public endpoints that personalise their response
 * when a token is present, e.g. owners previewing their pending job).
 * An invalid token is treated the same as no token.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = (await authenticate(req, false)) ?? undefined;
  } catch {
    // fall through as anonymous
  }
  next();
}

/** Restricts a route to specific roles. Must run after `requireAuth`. */
export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
