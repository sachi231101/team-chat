"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
const request_user_1 = require("../request-user");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (request.user?.userId || request.user?.id) {
        const user = request.user;
        const uid = user.userId || user.id;
        return {
            userId: uid,
            id: uid,
            workplaceId: user.workplaceId || (0, request_user_1.readUserFromHeaders)(request.headers).workplaceId,
            role: user.role || (0, request_user_1.readUserFromHeaders)(request.headers).role,
            permissions: user.permissions || (0, request_user_1.readUserFromHeaders)(request.headers).permissions,
        };
    }
    const user = (0, request_user_1.readUserFromHeaders)(request.headers);
    request.user = user;
    return user;
});
//# sourceMappingURL=current-user.decorator.js.map