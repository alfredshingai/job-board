import jwt, { type SignOptions } from 'jsonwebtoken';
import env from '../config/env.js';
import type { AuthUser } from '../types/express.js';

const SECRET: jwt.Secret = env.JWT_SECRET;

/** Payload stored inside the JWT — keep it minimal, role is re-checked from DB. */
export type TokenPayload = { sub: string };

export function signToken(userId: string): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId } satisfies TokenPayload, SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, SECRET) as TokenPayload;
}

/** Public shape of a user, safe to return in API responses. */
export function toSafeUser(user: { id: string; email: string; name: string; role: AuthUser['role'] }): AuthUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
