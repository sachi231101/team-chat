import { InternalServerErrorException, Logger } from '@nestjs/common';

const logger = new Logger('InternalError');

/**
 * Throws a client-safe 500 without leaking DB / stack details.
 * Full error is logged server-side only.
 */
export function throwInternal(clientMessage: string, error?: unknown): never {
  if (error !== undefined) {
    logger.error(
      clientMessage,
      error instanceof Error ? error.stack : String(error),
    );
  } else {
    logger.error(clientMessage);
  }
  throw new InternalServerErrorException(clientMessage);
}
