import { describe, expect, it } from 'vitest';
import { signToken, toSafeUser, verifyToken } from '../../src/utils/jwt.js';

describe('jwt tokens', () => {
  it('signs and verifies a user id', () => {
    const token = signToken('user_123');
    expect(verifyToken(token).sub).toBe('user_123');
  });

  it('rejects tampered tokens', () => {
    const token = signToken('user_123');
    expect(() => verifyToken(token + 'x')).toThrow();
    expect(() => verifyToken('not-a-token')).toThrow();
  });
});

describe('toSafeUser', () => {
  it('strips everything but the public fields', () => {
    const safe = toSafeUser({
      id: 'u1',
      email: 'a@b.co',
      name: 'A',
      role: 'USER',
      // @ts-expect-error — extra sensitive field must not leak
      passwordHash: '$2a$10$evil',
    });
    expect(safe).toEqual({ id: 'u1', email: 'a@b.co', name: 'A', role: 'USER' });
  });
});
