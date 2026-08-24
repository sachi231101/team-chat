import { Injectable } from '@nestjs/common';

@Injectable()
export class MentionsService {
  extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex) || [];
    return matches.map((m) => m.slice(1));
  }
}
