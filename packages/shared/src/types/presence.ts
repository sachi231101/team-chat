import { UserStatus } from './user';

export interface UserPresence {
  userId: string;
  status: UserStatus;
  customStatus?: string;
  lastActiveAt: string;
}
