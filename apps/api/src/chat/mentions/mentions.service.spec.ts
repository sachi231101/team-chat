import { MentionsService } from './mentions.service';

describe('MentionsService', () => {
  const service = new MentionsService({} as never);

  it('extracts @names from message content', () => {
    expect(service.extractMentions('Hello @Rahul and @Priya')).toEqual(['Rahul', 'Priya']);
  });

  it('returns an empty list when there are no mentions', () => {
    expect(service.extractMentions('No mentions here')).toEqual([]);
  });
});
