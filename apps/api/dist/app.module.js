"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const health_controller_1 = require("./health.controller");
const common_module_1 = require("./common/common.module");
const chat_module_1 = require("./chat/chat.module");
const attachments_module_1 = require("./attachments/attachments.module");
const notifications_module_1 = require("./notifications/notifications.module");
const presence_module_1 = require("./presence/presence.module");
const search_module_1 = require("./search/search.module");
const realtime_module_1 = require("./realtime/realtime.module");
const ai_module_1 = require("./ai/ai.module");
const redis_module_1 = require("./redis/redis.module");
const redis_throttler_storage_1 = require("./redis/redis-throttler.storage");
const redis_service_1 = require("./redis/redis.service");
const guards_1 = require("./common/guards");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../../.env'],
            }),
            redis_module_1.RedisModule,
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [redis_module_1.RedisModule],
                inject: [redis_throttler_storage_1.RedisThrottlerStorage, redis_service_1.RedisService],
                useFactory: (storage, redis) => ({
                    storage: redis.isReady ? storage : undefined,
                    throttlers: [
                        {
                            ttl: 60000,
                            limit: process.env.NODE_ENV === 'production' ? 200 : 2000,
                        },
                    ],
                    skipIf: (context) => {
                        const req = context.switchToHttp().getRequest();
                        const url = req.url || '';
                        return url.startsWith('/health') || url.startsWith('/ready');
                    },
                }),
            }),
            common_module_1.CommonModule,
            chat_module_1.ChatModule,
            attachments_module_1.AttachmentsModule,
            notifications_module_1.NotificationsModule,
            presence_module_1.PresenceModule,
            search_module_1.SearchModule,
            realtime_module_1.RealtimeModule,
            ai_module_1.AiModule,
        ],
        controllers: [app_controller_1.AppController, health_controller_1.HealthController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: guards_1.IdentityGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: guards_1.PermissionsGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map