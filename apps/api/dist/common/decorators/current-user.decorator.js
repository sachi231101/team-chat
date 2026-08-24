"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return (request.user || {
        id: request.headers['x-user-id'] || 'usr-rahul',
        workplaceId: request.headers['x-workplace-id'] || 'wp-teamchat-main',
    });
});
//# sourceMappingURL=current-user.decorator.js.map