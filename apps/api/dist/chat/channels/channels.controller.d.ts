import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { AddChannelMembersDto } from './dto/add-member.dto';
export declare class ChannelsController {
    private readonly channelsService;
    constructor(channelsService: ChannelsService);
    findAll(): Promise<import("@team-chat/shared").Channel[]>;
    findOne(id: string): Promise<import("@team-chat/shared").Channel>;
    create(body: CreateChannelDto): Promise<import("@team-chat/shared").Channel>;
    getMembers(id: string): Promise<import("@team-chat/shared").User[]>;
    addMembers(id: string, body: AddChannelMembersDto): Promise<import("@team-chat/shared").User[]>;
    removeMember(id: string, userId: string): Promise<{
        success: boolean;
    }>;
}
