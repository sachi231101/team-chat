import { Module } from '@nestjs/common';
import { ChannelsModule } from './channels/channels.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { ThreadsModule } from './threads/threads.module';
import { ReactionsModule } from './reactions/reactions.module';
import { MentionsModule } from './mentions/mentions.module';
import { SavedMessagesModule } from './saved-messages/saved-messages.module';

@Module({
  imports: [
    ChannelsModule,
    ConversationsModule,
    MessagesModule,
    ThreadsModule,
    ReactionsModule,
    MentionsModule,
    SavedMessagesModule,
  ],
  exports: [
    ChannelsModule,
    ConversationsModule,
    MessagesModule,
    ThreadsModule,
    ReactionsModule,
    MentionsModule,
    SavedMessagesModule,
  ],
})
export class ChatModule {}
