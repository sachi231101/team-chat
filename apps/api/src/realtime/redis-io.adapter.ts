import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, type RedisClientType } from 'redis';
import { Logger } from '@nestjs/common';

const REDIS_CONNECT_TIMEOUT_MS = Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 3000);

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private readonly logger = new Logger(RedisIoAdapter.name);

  async connectToRedis(): Promise<void> {
    const redisUrl =
      process.env.REDIS_URL ||
      (process.env.REDIS_HOST
        ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
        : null);

    if (!redisUrl) {
      this.logger.log(
        'No REDIS_URL or REDIS_HOST provided. Socket.IO is using the default in-memory adapter.',
      );
      return;
    }

    let pubClient: RedisClientType | null = null;
    let subClient: RedisClientType | null = null;

    try {
      pubClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
          reconnectStrategy: false,
        },
      });
      subClient = pubClient.duplicate();

      pubClient.on('error', (err) => {
        this.logger.warn(`Redis Pub client error: ${(err as Error).message}`);
      });
      subClient.on('error', (err) => {
        this.logger.warn(`Redis Sub client error: ${(err as Error).message}`);
      });

      await Promise.race([
        Promise.all([pubClient.connect(), subClient.connect()]),
        new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(
                  `Redis connection timed out after ${REDIS_CONNECT_TIMEOUT_MS}ms`,
                ),
              ),
            REDIS_CONNECT_TIMEOUT_MS,
          );
        }),
      ]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log(`Socket.IO Redis adapter connected to ${redisUrl}`);
    } catch (error) {
      this.logger.warn(
        `Failed to connect to Redis (${(error as Error).message}). Falling back to in-memory adapter.`,
      );
      this.adapterConstructor = null;
      await Promise.allSettled([
        pubClient?.isOpen ? pubClient.quit() : Promise.resolve(),
        subClient?.isOpen ? subClient.quit() : Promise.resolve(),
      ]);
    }
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }
    return server;
  }
}
