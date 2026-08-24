export declare const APP_CONFIG: {
    readonly appName: "Team Chat";
    readonly version: "1.0.0";
    readonly defaultPort: 3000;
    readonly defaultWsPort: 3000;
    readonly maxMessageLength: 4000;
    readonly maxAttachmentSizeBytes: number;
    readonly supportedImageTypes: readonly ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    readonly socketEvents: {
        readonly JOIN_CHANNEL: "channel:join";
        readonly LEAVE_CHANNEL: "channel:leave";
        readonly NEW_MESSAGE: "message:new";
        readonly UPDATE_MESSAGE: "message:update";
        readonly DELETE_MESSAGE: "message:delete";
        readonly MESSAGE_REACTION: "message:reaction";
        readonly USER_TYPING: "user:typing";
        readonly PRESENCE_UPDATE: "presence:update";
        readonly NOTIFICATION_NEW: "notification:new";
    };
};
