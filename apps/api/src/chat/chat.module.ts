import { Module } from '@nestjs/common';
import { ChannelsModule } from './channels/channels.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { ThreadsModule } from './threads/threads.module';
import { ReactionsModule } from './reactions/reactions.module';
import { MentionsModule } from './mentions/mentions.module';
import { SavedMessagesModule } from './saved-messages/saved-messages.module';
import { ActionsModule } from './actions/actions.module';
import { TagsModule } from './tags/tags.module';
import { PollsModule } from './polls/polls.module';

@Module({
  imports: [
    ChannelsModule,
    ConversationsModule,
    MessagesModule,
    ThreadsModule,
    ReactionsModule,
    MentionsModule,
    SavedMessagesModule,
    ActionsModule,
    TagsModule,
    PollsModule,
  ],
  exports: [
    ChannelsModule,
    ConversationsModule,
    MessagesModule,
    ThreadsModule,
    ReactionsModule,
    MentionsModule,
    SavedMessagesModule,
    ActionsModule,
    TagsModule,
    PollsModule,
  ],
})
export class ChatModule {}

