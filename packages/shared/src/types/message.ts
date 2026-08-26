import { MessageTag } from './message-tag';
import { ActionItem } from './action-item';

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  previewUrl?: string;
  createdAt: string;
}

export interface PollOption {
  index: number;
  text: string;
  voteCount: number;
  percentage: number;
  hasVoted?: boolean;
  voters?: { id: string; name: string; avatarUrl?: string | null }[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  totalVoters: number;
  isMultiChoice: boolean;
  isAnonymous: boolean;
  isClosed: boolean;
  createdById: string;
  creatorName?: string;
  messageId?: string | null;
  channelId?: string | null;
  conversationId?: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  clientMessageId?: string;
  channelId?: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  parentMessageId?: string;
  replyCount?: number;
  lastReplyAt?: string;
  reactions: MessageReaction[];
  attachments?: Attachment[];
  tags?: MessageTag[];
  actionItems?: ActionItem[];
  poll?: Poll;
  pinned?: boolean;
  editedAt?: string;
  deliveryStatus?: 'sending' | 'sent' | 'failed';
  createdAt: string;
  updatedAt: string;
}


export interface Conversation {
  id: string;
  participants: string[];
  workplaceId: string;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}
