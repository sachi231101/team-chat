import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { AddChannelMembersDto } from './dto/add-member.dto';
import type { RequestUser } from '../../common/request-user';
export declare class ChannelsController {
    private readonly channelsService;
    constructor(channelsService: ChannelsService);
    findAll(user: RequestUser): Promise<import("@team-chat/shared").Channel[]>;
    findOne(id: string, user: RequestUser): Promise<import("@team-chat/shared").Channel>;
    create(user: RequestUser, body: CreateChannelDto): Promise<import("@team-chat/shared").Channel>;
    getMembers(id: string): Promise<import("@team-chat/shared").User[]>;
    addMembers(id: string, body: AddChannelMembersDto): Promise<import("@team-chat/shared").User[]>;
    removeMember(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
