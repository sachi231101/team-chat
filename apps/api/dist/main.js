"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = require("connect-redis");
const fs_1 = require("fs");
const app_module_1 = require("./app.module");
const filters_1 = require("./common/filters");
const attachments_service_1 = require("./attachments/attachments.service");
const redis_io_adapter_1 = require("./realtime/redis-io.adapter");
const redis_service_1 = require("./redis/redis.service");
function allowedOrigins() {
    const raw = process.env.ALLOWED_ORIGINS || '';
    const fromEnv = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return fromEnv.length
        ? fromEnv
        : [/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/];
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_1.Logger('Bootstrap');
    if (process.env.TRUST_PROXY === 'true') {
        app.set('trust proxy', 1);
    }
    const redisIoAdapter = new redis_io_adapter_1.RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
    if (!(0, fs_1.existsSync)(attachments_service_1.UPLOAD_DIR)) {
        (0, fs_1.mkdirSync)(attachments_service_1.UPLOAD_DIR, { recursive: true });
    }
    app.use((0, helmet_1.default)({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    if (process.env.SESSION_ENABLED === 'true') {
        const redis = app.get(redis_service_1.RedisService);
        if (!redis.isReady) {
            if (process.env.REDIS_REQUIRED === 'true') {
                throw new Error('SESSION_ENABLED requires Redis');
            }
            logger.warn('SESSION_ENABLED is set but Redis is not ready; skipping shared sessions');
        }
        else {
            app.use((0, express_session_1.default)({
                store: new connect_redis_1.RedisStore({
                    client: redis.getClient(),
                    prefix: 'sess:',
                }),
                secret: process.env.SESSION_SECRET || 'team-chat-dev-session',
                resave: false,
                saveUninitialized: false,
                proxy: process.env.TRUST_PROXY === 'true',
                cookie: {
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: false,
                },
            }));
            logger.log('Redis-backed express-session enabled');
        }
    }
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const allowed = allowedOrigins();
            const ok = allowed.some((rule) => typeof rule === 'string' ? rule === origin : rule.test(origin));
            if (ok)
                return callback(null, true);
            callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-workplace-id'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new filters_1.HttpExceptionFilter());
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`Team Chat API is running on: http://localhost:${port}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map