"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
const mock_identity_1 = require("../mock-identity");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return (0, mock_identity_1.attachMockIdentity)(request);
});
//# sourceMappingURL=current-user.decorator.js.map