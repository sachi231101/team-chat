export declare class UpdateUserDto {
    name?: string;
    email?: string;
    avatarUrl?: string;
    title?: string;
    status?: 'online' | 'busy' | 'away' | 'offline';
    statusMessage?: string;
}
