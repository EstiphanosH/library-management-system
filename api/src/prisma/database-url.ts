export function validateDatabaseUrl(value: string | undefined): void {
  if (!value) {
    throw new Error(
      'DATABASE_URL is missing. Set it in api/.env using the connection string from the Neon dashboard.',
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      'DATABASE_URL is invalid. Use the complete Neon connection string beginning with postgresql:// or postgres://.',
    );
  }

  if (
    (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') ||
    !url.hostname
  ) {
    throw new Error(
      'DATABASE_URL is invalid. Use the complete Neon connection string beginning with postgresql:// or postgres://.',
    );
  }
}
