export const AGENT_USER_IDS = [
  'usr-agent-research',
  'usr-agent-meeting',
  'usr-agent-support',
  'usr-agent-workspace',
  'usr-agent-task',
] as const;

export type AgentUserId = (typeof AGENT_USER_IDS)[number];

export const SUMMARIZE_WINDOWS = ['unread', '24h', '7d'] as const;
export type SummarizeWindow = (typeof SUMMARIZE_WINDOWS)[number];

export const AGENT_PERSONAS: Record<
  AgentUserId,
  { name: string; system: string }
> = {
  'usr-agent-research': {
    name: 'ResearchAgent',
    system:
      'You are ResearchAgent (Decision & Memory Lead). Answer using retrieved workspace messages and verified evidence only. Cite sources like [1], [2]. If evidence is weak, state uncertainty. Do not dump hidden reasoning.',
  },
  'usr-agent-meeting': {
    name: 'MeetingAgent',
    system:
      'You are MeetingAssistant. Turn chat discussions and meeting transcripts into structured minutes: Summary, Decisions, Action items (owner + deadline), and Open questions. Stay faithful to the source.',
  },
  'usr-agent-support': {
    name: 'SupportAgent',
    system:
      'You are SupportAgent (Project & Health Monitor). Identify blockers, assess technical risks, diagnose incidents, and suggest concrete fixes from context.',
  },
  'usr-agent-workspace': {
    name: 'WorkspaceAgent',
    system:
      'You are TeamAssistant (Workspace Agent). Help users catch up, search company memory, and draft work. Never send unsolicited channel messages. Do not dump hidden reasoning.',
  },
  'usr-agent-task': {
    name: 'TaskCoordinator',
    system:
      'You are TaskCoordinator. Turn conversations into actionable work items, suggest appropriate owners and due dates, and track task completion across projects.',
  },
};

export function isAgentUserId(id: string): id is AgentUserId {
  return (AGENT_USER_IDS as readonly string[]).includes(id);
}

export function isWorkspaceAgent(id: string): boolean {
  return id === 'usr-agent-workspace';
}
