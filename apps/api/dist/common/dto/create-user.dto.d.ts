export declare class CreateUserDto {
    name: string;
    email: string;
    avatarUrl?: string;
    title?: string;
    status?: 'online' | 'busy' | 'away' | 'offline';
    statusMessage?: string;
    workplaceId?: string;
}
