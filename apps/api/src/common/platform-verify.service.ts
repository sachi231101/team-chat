import { Injectable, Logger } from '@nestjs/common';

export interface PlatformVerifyResult {
  valid: boolean;
  suspended?: boolean;
  error?: string;
}

/**
 * Optional server-side re-validation against Workplace Platform SSO verify endpoint.
 * Used on WebSocket connect and periodically for suspension checks.
 */
@Injectable()
export class PlatformVerifyService {
  private readonly logger = new Logger(PlatformVerifyService.name);
  private readonly cache = new Map<string, { ok: boolean; expiresAt: number }>();
  private readonly cacheTtlMs = 5 * 60 * 1000;

  async verifyLaunchToken(token: string): Promise<PlatformVerifyResult> {
    const platformUrl = process.env.WORKPLACE_PLATFORM_URL?.trim();
    if (!platformUrl) {
      return { valid: true };
    }

    const cacheKey = token.slice(0, 32);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.ok ? { valid: true } : { valid: false, error: 'Cached verification failed' };
    }

    try {
      const res = await fetch(`${platformUrl.replace(/\/$/, '')}/api/platform/sso/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, productKey: 'team_chat', audience: 'team_chat' }),
        signal: AbortSignal.timeout(Number(process.env.PLATFORM_VERIFY_TIMEOUT_MS || 5000)),
      });

      const body = (await res.json()) as { success?: boolean; error?: { code?: string; message?: string } };

      if (res.ok && body.success) {
        this.cache.set(cacheKey, { ok: true, expiresAt: Date.now() + this.cacheTtlMs });
        return { valid: true };
      }

      const suspended = body.error?.code === 'USER_SUSPENDED';
      this.cache.set(cacheKey, { ok: false, expiresAt: Date.now() + 60_000 });
      return {
        valid: false,
        suspended,
        error: body.error?.message || `Platform verify returned ${res.status}`,
      };
    } catch (err) {
      this.logger.warn(`Platform SSO verify unavailable: ${(err as Error).message}`);
      return { valid: true };
    }
  }
}
