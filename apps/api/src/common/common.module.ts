import { Module, Global } from '@nestjs/common';
import { DataStoreService } from './data-store.service';
import { PrismaService } from './prisma.service';
import { UsersController } from './users.controller';

@Global()
@Module({
  controllers: [UsersController],
  providers: [DataStoreService, PrismaService],
  exports: [DataStoreService, PrismaService],
})
export class CommonModule {}
