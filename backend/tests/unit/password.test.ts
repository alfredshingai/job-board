import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/utils/password.js';

describe('password hashing', () => {
  it('round-trips a valid password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('wrong password', hash)).toBe(false);
  });

  it('produces a bcrypt hash, never the plaintext', async () => {
    const hash = await hashPassword('hunter2hunter2');
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toContain('hunter2');
  });
});
