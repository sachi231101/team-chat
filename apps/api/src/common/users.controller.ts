import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Body,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePresenceDto } from '../presence/dto/update-presence.dto';
import { UserStatus as PrismaUserStatus } from '@prisma/client';
import { isPrismaNotFound } from './prisma-errors';
import { User, UserStatus } from '@team-chat/shared';
import { provisionUserPublicChannels } from './default-channels';
import { CurrentUser } from './decorators';
import type { RequestUser } from './request-user';

@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@CurrentUser() user: RequestUser): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { workplaceId: user.workplaceId },
        orderBy: { createdAt: 'asc' },
      });

      return users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl ?? undefined,
        title: u.title ?? undefined,
        status: u.status.toLowerCase() as UserStatus,
        statusMessage: u.statusMessage ?? undefined,
        workplaceId: u.workplaceId,
        createdAt: u.createdAt.toISOString(),
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch users: ${(error as Error).message}`,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<User> {
    try {
      const u = await this.prisma.user.findFirst({
        where: { id, workplaceId: user.workplaceId },
      });
      if (!u) {
        throw new NotFoundException(`User ${id} not found in this workplace`);
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl ?? undefined,
        title: u.title ?? undefined,
        status: u.status.toLowerCase() as UserStatus,
        statusMessage: u.statusMessage ?? undefined,
        workplaceId: u.workplaceId,
        createdAt: u.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch user ${id}: ${(error as Error).message}`,
      );
    }
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() body: CreateUserDto): Promise<User> {
    try {
      const prismaStatus = (body.status?.toUpperCase() || 'ONLINE') as PrismaUserStatus;
      const workplaceId = user.workplaceId || body.workplaceId || 'wp-teamchat-main';

      const u = await this.prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          avatarUrl: body.avatarUrl,
          title: body.title,
          status: prismaStatus,
          statusMessage: body.statusMessage,
          workplaceId,
        },
      });

      await provisionUserPublicChannels(
        this.prisma,
        u.id,
        u.workplaceId,
      );

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl ?? undefined,
        title: u.title ?? undefined,
        status: u.status.toLowerCase() as UserStatus,
        statusMessage: u.statusMessage ?? undefined,
        workplaceId: u.workplaceId,
        createdAt: u.createdAt.toISOString(),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create user: ${(error as Error).message}`,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() body: UpdateUserDto,
  ): Promise<User> {
    try {
      const existing = await this.prisma.user.findFirst({
        where: { id, workplaceId: user.workplaceId },
      });
      if (!existing) {
        throw new NotFoundException(`User ${id} not found in this workplace`);
      }

      if (id !== user.userId && user.role !== 'admin') {
        throw new ForbiddenException('You can only update your own profile');
      }

      const data: Record<string, unknown> = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.email !== undefined) data.email = body.email;
      if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
      if (body.title !== undefined) data.title = body.title;
      if (body.status !== undefined) {
        data.status = body.status.toUpperCase() as PrismaUserStatus;
      }
      if (body.statusMessage !== undefined) data.statusMessage = body.statusMessage;

      const u = await this.prisma.user.update({
        where: { id },
        data,
      });

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl ?? undefined,
        title: u.title ?? undefined,
        status: u.status.toLowerCase() as UserStatus,
        statusMessage: u.statusMessage ?? undefined,
        workplaceId: u.workplaceId,
        createdAt: u.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      if (isPrismaNotFound(error)) {
        throw new NotFoundException(`User ${id} not found`);
      }
      throw new InternalServerErrorException(
        `Failed to update user ${id}: ${(error as Error).message}`,
      );
    }
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() body: UpdatePresenceDto,
  ): Promise<User> {
    try {
      const existing = await this.prisma.user.findFirst({
        where: { id, workplaceId: user.workplaceId },
      });
      if (!existing) {
        throw new NotFoundException(`User ${id} not found in this workplace`);
      }

      if (id !== user.userId) {
        throw new ForbiddenException('You can only update your own status');
      }

      const prismaStatus = body.status.toUpperCase() as PrismaUserStatus;
      const u = await this.prisma.user.update({
        where: { id },
        data: {
          status: prismaStatus,
          statusMessage: body.statusMessage,
        },
      });

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl ?? undefined,
        title: u.title ?? undefined,
        status: u.status.toLowerCase() as UserStatus,
        statusMessage: u.statusMessage ?? undefined,
        workplaceId: u.workplaceId,
        createdAt: u.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      if (isPrismaNotFound(error)) {
        throw new NotFoundException(`User ${id} not found`);
      }
      throw new InternalServerErrorException(
        `Failed to update status for user ${id}: ${(error as Error).message}`,
      );
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: RequestUser): Promise<{ success: boolean }> {
    try {
      const existing = await this.prisma.user.findFirst({
        where: { id, workplaceId: user.workplaceId },
      });
      if (!existing) {
        throw new NotFoundException(`User ${id} not found in this workplace`);
      }

      if (id !== user.userId && user.role !== 'admin') {
        throw new ForbiddenException('You can only delete your own profile');
      }

      await this.prisma.user.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      if (isPrismaNotFound(error)) {
        throw new NotFoundException(`User ${id} not found`);
      }
      throw new InternalServerErrorException(
        `Failed to delete user ${id}: ${(error as Error).message}`,
      );
    }
  }
}

