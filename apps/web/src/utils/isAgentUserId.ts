export function isAgentUserId(id: string): boolean {
  return id.startsWith('usr-agent-');
}
