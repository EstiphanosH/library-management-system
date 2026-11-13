import { validateDatabaseUrl } from './database-url.js';

describe('validateDatabaseUrl', () => {
  it.each([
    'postgresql://user:password@ep-example.region.aws.neon.tech/library?sslmode=require',
    'postgres://user:password@localhost:5432/library',
  ])('accepts a supported PostgreSQL URL', (value) => {
    expect(() => validateDatabaseUrl(value)).not.toThrow();
  });

  it.each([undefined, ''])(
    'rejects a missing or malformed URL',
    (value) => {
      expect(() => validateDatabaseUrl(value)).toThrow(
        'DATABASE_URL is missing',
      );
    },
  );

  it('rejects a URL without a scheme', () => {
    expect(() =>
      validateDatabaseUrl('ep-example.region.aws.neon.tech/library'),
    ).toThrow('beginning with postgresql:// or postgres://');
  });

  it('rejects a URL with an unsupported protocol', () => {
    expect(() =>
      validateDatabaseUrl('https://ep-example.region.aws.neon.tech/library'),
    ).toThrow('beginning with postgresql:// or postgres://');
  });
});
