import { PrismaService } from './prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePresenceDto } from '../presence/dto/update-presence.dto';
import { User } from '@team-chat/shared';
export declare class UsersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    create(body: CreateUserDto): Promise<User>;
    update(id: string, body: UpdateUserDto): Promise<User>;
    updateStatus(id: string, body: UpdatePresenceDto): Promise<User>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
}
