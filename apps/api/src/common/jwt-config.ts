const DEV_JWT_SECRET = 'workplace_platform_shared_product_launch_jwt_secret_2026';

export const JWT_ISSUER = 'workplace-platform';
export const JWT_AUDIENCE_TEAM_CHAT = 'team_chat';

export function getSharedJwtSecret(): string {
  const secret = process.env.SHARED_JWT_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SHARED_JWT_SECRET is required in production. Set it to match Workplace Platform.',
    );
  }

  return DEV_JWT_SECRET;
}

export function isMockIdentityAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return process.env.ALLOW_MOCK_IDENTITY === 'true';
  }
  return process.env.ALLOW_MOCK_IDENTITY !== 'false';
}
