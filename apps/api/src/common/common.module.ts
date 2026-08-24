import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersController } from './users.controller';
import { ChatAccessService } from './chat-access.service';

@Global()
@Module({
  controllers: [UsersController],
  providers: [PrismaService, ChatAccessService],
  exports: [PrismaService, ChatAccessService],
})
export class CommonModule {}
