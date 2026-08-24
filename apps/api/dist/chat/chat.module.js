"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const channels_module_1 = require("./channels/channels.module");
const conversations_module_1 = require("./conversations/conversations.module");
const messages_module_1 = require("./messages/messages.module");
const threads_module_1 = require("./threads/threads.module");
const reactions_module_1 = require("./reactions/reactions.module");
const mentions_module_1 = require("./mentions/mentions.module");
const saved_messages_module_1 = require("./saved-messages/saved-messages.module");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            channels_module_1.ChannelsModule,
            conversations_module_1.ConversationsModule,
            messages_module_1.MessagesModule,
            threads_module_1.ThreadsModule,
            reactions_module_1.ReactionsModule,
            mentions_module_1.MentionsModule,
            saved_messages_module_1.SavedMessagesModule,
        ],
        exports: [
            channels_module_1.ChannelsModule,
            conversations_module_1.ConversationsModule,
            messages_module_1.MessagesModule,
            threads_module_1.ThreadsModule,
            reactions_module_1.ReactionsModule,
            mentions_module_1.MentionsModule,
            saved_messages_module_1.SavedMessagesModule,
        ],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map