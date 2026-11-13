import { getJwtSecret } from './jwt-secret.js';

describe('getJwtSecret', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('rejects missing and weak secrets', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow('JWT_SECRET is missing');

    process.env.JWT_SECRET = 'too-short';
    expect(() => getJwtSecret()).toThrow('at least 32 bytes');
  });

  it('accepts a secret with at least 32 bytes', () => {
    process.env.JWT_SECRET = 'a-secure-test-secret-with-at-least-32-bytes';
    expect(getJwtSecret()).toBe(process.env.JWT_SECRET);
  });
});
