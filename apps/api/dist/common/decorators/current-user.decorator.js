"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
const request_user_1 = require("../request-user");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (request.user?.id) {
        return {
            id: request.user.id,
            workplaceId: request.user.workplaceId ?? (0, request_user_1.readUserFromHeaders)(request.headers).workplaceId,
        };
    }
    return (0, request_user_1.readUserFromHeaders)(request.headers);
});
//# sourceMappingURL=current-user.decorator.js.map