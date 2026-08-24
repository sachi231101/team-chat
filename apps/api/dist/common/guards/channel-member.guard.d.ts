import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ChatAccessService } from '../chat-access.service';
export declare class ChannelMemberGuard implements CanActivate {
    private readonly chatAccess;
    constructor(chatAccess: ChatAccessService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
