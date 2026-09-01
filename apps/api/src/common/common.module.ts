import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersController } from './users.controller';
import { ChatAccessService } from './chat-access.service';
import { PlatformVerifyService } from './platform-verify.service';

@Global()
@Module({
  controllers: [UsersController],
  providers: [PrismaService, ChatAccessService, PlatformVerifyService],
  exports: [PrismaService, ChatAccessService, PlatformVerifyService],
})
export class CommonModule {}
