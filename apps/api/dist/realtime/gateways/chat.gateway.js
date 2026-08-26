"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const presence_service_1 = require("../../presence/presence.service");
const realtime_service_1 = require("../realtime.service");
const chat_access_service_1 = require("../../common/chat-access.service");
const request_user_1 = require("../../common/request-user");
function allowedOrigins() {
    const raw = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '';
    const fromEnv = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (fromEnv.length)
        return fromEnv;
    return ['http://localhost:5173', 'http://localhost:3001'];
}
let ChatGateway = ChatGateway_1 = class ChatGateway {
    presenceService;
    realtime;
    chatAccess;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    constructor(presenceService, realtime, chatAccess) {
        this.presenceService = presenceService;
        this.realtime = realtime;
        this.chatAccess = chatAccess;
    }
    afterInit(server) {
        this.realtime.setServer(server);
    }
    handleConnection(client) {
        const userId = client.handshake.auth?.userId ||
            client.handshake.headers['x-user-id'] ||
            request_user_1.DEFAULT_MOCK_USER_ID;
        const workplaceId = client.handshake.auth?.workplaceId ||
            client.handshake.headers['x-workplace-id'] ||
            request_user_1.DEFAULT_WORKPLACE_ID;
        client.data.userId = userId;
        client.data.workplaceId = workplaceId;
        client.join(`user:${userId}`);
        client.join(`workplace:${workplaceId}`);
        this.logger.log(`Client connected: ${client.id} as ${userId} in ${workplaceId}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    async handleJoinChannel(client, data) {
        const user = {
            userId: client.data.userId,
            workplaceId: client.data.workplaceId,
        };
        const allowed = await this.chatAccess.canJoinChannel(user, data.channelId);
        if (!allowed) {
            return { event: 'error', message: 'Not allowed to join this channel' };
        }
        const room = `channel:${data.channelId}`;
        client.join(room);
        return { event: 'joined', channelId: data.channelId };
    }
    handleLeaveChannel(client, data) {
        client.leave(`channel:${data.channelId}`);
        return { event: 'left', channelId: data.channelId };
    }
    async handleJoinConversation(client, data) {
        const user = {
            userId: client.data.userId,
            workplaceId: client.data.workplaceId,
        };
        const allowed = await this.chatAccess.canJoinConversation(user, data.conversationId);
        if (!allowed) {
            return { event: 'error', message: 'Not allowed to join this conversation' };
        }
        client.join(`conversation:${data.conversationId}`);
        return { event: 'joined', conversationId: data.conversationId };
    }
    async handlePresenceUpdate(client, data) {
        const userId = client.data.userId;
        const workplaceId = client.data.workplaceId;
        try {
            const user = await this.presenceService.setPresence(userId, data.status, data.statusMessage);
            this.realtime.emitToWorkplace(workplaceId, 'presence:updated', user);
            return user;
        }
        catch (error) {
            this.logger.error(`Failed to update presence for ${userId}: ${error.message}`);
            return { error: 'Failed to update presence' };
        }
    }
    async handleTypingStart(client, data) {
        const user = {
            userId: client.data.userId,
            workplaceId: client.data.workplaceId,
        };
        if (data.channelId) {
            const allowed = await this.chatAccess.canJoinChannel(user, data.channelId);
            if (!allowed)
                return { error: 'Not authorized' };
        }
        if (data.conversationId) {
            const allowed = await this.chatAccess.canJoinConversation(user, data.conversationId);
            if (!allowed)
                return { error: 'Not authorized' };
        }
        const payload = { userId: user.userId, userName: data.userName, channelId: data.channelId, conversationId: data.conversationId };
        this.realtime.emitToChat(data, 'typing:started', payload);
    }
    async handleTypingStop(client, data) {
        const user = {
            userId: client.data.userId,
            workplaceId: client.data.workplaceId,
        };
        if (data.channelId) {
            const allowed = await this.chatAccess.canJoinChannel(user, data.channelId);
            if (!allowed)
                return { error: 'Not authorized' };
        }
        if (data.conversationId) {
            const allowed = await this.chatAccess.canJoinConversation(user, data.conversationId);
            if (!allowed)
                return { error: 'Not authorized' };
        }
        this.realtime.emitToChat(data, 'typing:stopped', {
            userId: user.userId,
            channelId: data.channelId,
            conversationId: data.conversationId,
        });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('channel:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('channel:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('conversation:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('presence:update'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handlePresenceUpdate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStop", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: allowedOrigins(),
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [presence_service_1.PresenceService,
        realtime_service_1.RealtimeService,
        chat_access_service_1.ChatAccessService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map