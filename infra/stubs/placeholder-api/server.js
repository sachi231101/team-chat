'use strict';

const http = require('http');
const os = require('os');
const { createClient } = require('redis');

const SERVICE_NAME = process.env.SERVICE_NAME || 'placeholder';
const PORT = Number(process.env.PORT || 3000);
const REDIS_URL = process.env.REDIS_URL || '';
const SESSION_KEY = 'session:shared';

let redis = null;
let redisReady = false;

async function connectRedis() {
  if (!REDIS_URL) {
    console.warn(`[${SERVICE_NAME}] REDIS_URL not set; /session will be unavailable`);
    return;
  }
  redis = createClient({ url: REDIS_URL });
  redis.on('error', (err) => {
    console.warn(`[${SERVICE_NAME}] Redis error: ${err.message}`);
    redisReady = false;
  });
  await redis.connect();
  redisReady = true;
  console.log(`[${SERVICE_NAME}] Redis connected`);
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function notFound(res) {
  json(res, 404, { status: 'error', message: 'Not found', service: SERVICE_NAME });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'GET' && (path === '/health' || path === '/')) {
    json(res, 200, {
      status: 'ok',
      service: SERVICE_NAME,
      hostname: os.hostname(),
      redis: redisReady,
    });
    return;
  }

  if (req.method === 'GET' && path === '/session') {
    if (!redisReady || !redis) {
      json(res, 503, {
        status: 'degraded',
        service: SERVICE_NAME,
        hostname: os.hostname(),
        message: 'Redis is not connected',
      });
      return;
    }
    try {
      const created = await redis.set(SESSION_KEY, `ok:${Date.now()}`, {
        NX: true,
      });
      const value = await redis.get(SESSION_KEY);
      json(res, 200, {
        status: 'ok',
        service: SERVICE_NAME,
        hostname: os.hostname(),
        session: {
          key: SESSION_KEY,
          value,
          created: Boolean(created),
        },
      });
    } catch (err) {
      json(res, 503, {
        status: 'error',
        service: SERVICE_NAME,
        hostname: os.hostname(),
        message: err instanceof Error ? err.message : 'Redis session failed',
      });
    }
    return;
  }

  notFound(res);
});

connectRedis()
  .catch((err) => {
    console.error(`[${SERVICE_NAME}] Redis connect failed: ${err.message}`);
  })
  .finally(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[${SERVICE_NAME}] listening on ${PORT} hostname=${os.hostname()}`);
    });
  });
