export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET is missing. Add a private key of at least 32 bytes to api/.env (generate one with: node -e "console.log(require(\'node:crypto\').randomBytes(32).toString(\'base64url\'))").',
    );
  }
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes long');
  }
  return secret;
}
