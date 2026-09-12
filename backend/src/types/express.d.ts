import type { Role } from '@prisma/client';

/**
 * The authenticated user attached to `req.user` by the auth middleware.
 * Kept deliberately small — never includes the password hash.
 */
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
