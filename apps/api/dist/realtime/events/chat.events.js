"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatEvent = void 0;
var ChatEvent;
(function (ChatEvent) {
    ChatEvent["MESSAGE_NEW"] = "message:new";
    ChatEvent["MESSAGE_UPDATE"] = "message:update";
    ChatEvent["MESSAGE_DELETE"] = "message:delete";
    ChatEvent["MESSAGE_REACTION"] = "message:reaction";
    ChatEvent["USER_TYPING"] = "user:typing";
    ChatEvent["USER_PRESENCE"] = "presence:update";
    ChatEvent["CHANNEL_JOIN"] = "channel:join";
    ChatEvent["CHANNEL_LEAVE"] = "channel:leave";
})(ChatEvent || (exports.ChatEvent = ChatEvent = {}));
//# sourceMappingURL=chat.events.js.map