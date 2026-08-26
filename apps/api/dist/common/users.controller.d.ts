import { PrismaService } from './prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePresenceDto } from '../presence/dto/update-presence.dto';
import { User } from '@team-chat/shared';
import type { RequestUser } from './request-user';
export declare class UsersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(user: RequestUser): Promise<User[]>;
    findOne(id: string, user: RequestUser): Promise<User>;
    create(user: RequestUser, body: CreateUserDto): Promise<User>;
    update(id: string, user: RequestUser, body: UpdateUserDto): Promise<User>;
    updateStatus(id: string, user: RequestUser, body: UpdatePresenceDto): Promise<User>;
    delete(id: string, user: RequestUser): Promise<{
        success: boolean;
    }>;
}
