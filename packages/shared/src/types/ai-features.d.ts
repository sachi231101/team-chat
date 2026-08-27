import { ActionItemStatus } from './action-item';
export interface ExtractedTask {
    title: string;
    description?: string;
    assigneeName?: string;
    assigneeId?: string;
    dueDate?: string;
    status?: ActionItemStatus;
    confidence?: number;
}
export interface ExtractedDecision {
    title: string;
    rationale?: string;
    decidedBy?: string;
    impactedAreas?: string[];
    confidence?: number;
}
export interface ExtractedRisk {
    title: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    mitigation?: string;
    owner?: string;
}
export interface ExtractedApproval {
    item: string;
    requester?: string;
    approver?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
export interface WorkExtractionResult {
    tasks: ExtractedTask[];
    decisions: ExtractedDecision[];
    risks: ExtractedRisk[];
    approvals: ExtractedApproval[];
    summary: string;
    /** Present when the LLM call or parse failed; UI should show an error state. */
    error?: string;
}
export interface CitationItem {
    index: number;
    messageId: string;
    senderName: string;
    content: string;
    channelId?: string;
    channelName?: string;
    conversationId?: string;
    createdAt: string;
}
export interface CompanyMemoryResult {
    answer: string;
    citations: CitationItem[];
    relatedTopics?: string[];
}
export interface BriefingTask {
    id: string;
    title: string;
    status: ActionItemStatus;
    dueDate?: string | null;
    channelName?: string;
    isOverdue?: boolean;
}
export interface BriefingDecision {
    id: string;
    title: string;
    rationale?: string | null;
    channelName: string;
    createdAt: string;
}
export interface BriefingRisk {
    id: string;
    title: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    channelName: string;
}
export interface BriefingApproval {
    id: string;
    item: string;
    requester: string;
    status: string;
}
export interface DailyBriefingData {
    userId: string;
    userName: string;
    generatedAt: string;
    timeframe: 'today' | '24h' | '7d';
    summary: string;
    myTasks: BriefingTask[];
    keyDecisions: BriefingDecision[];
    blockersAndRisks: BriefingRisk[];
    pendingApprovals: BriefingApproval[];
    channelHighlights: {
        channelId: string;
        channelName: string;
        highlight: string;
    }[];
}
export interface AiTeammateInfo {
    id: string;
    name: string;
    title: string;
    roleDescription: string;
    avatarUrl?: string;
    status: 'ONLINE' | 'BUSY' | 'AWAY' | 'OFFLINE';
    activeTaskCount?: number;
    skills: string[];
}
export interface AiTaskProgressUpdate {
    actionItemId: string;
    agentId: string;
    status: ActionItemStatus;
    progressMessage: string;
    deliverable?: string;
}
export interface AgentCollaborationStep {
    stepIndex: number;
    agentId: string;
    agentName: string;
    role: string;
    thought: string;
    actionTaken: string;
    output: string;
    timestamp: string;
}
export interface MultiAgentCoordinationResult {
    objective: string;
    participatingAgents: string[];
    steps: AgentCollaborationStep[];
    finalResult: string;
    verified: boolean;
    confidenceScore: number;
    actionItemsCreated?: string[];
    decisionCaptured?: boolean;
}
export interface SmartRouteSuggestion {
    suggestedChannelId?: string;
    suggestedChannelName?: string;
    suggestedUserId?: string;
    suggestedUserName?: string;
    suggestedAgentId?: string;
    suggestedAgentName?: string;
    shouldCreateTask?: boolean;
    suggestedTaskTitle?: string;
    confidence: number;
    reason: string;
}
export type DecisionStatus = 'APPROVED' | 'UNDER_REVIEW' | 'SUPERSEDED';
export interface DecisionRecord {
    id: string;
    title: string;
    rationale?: string | null;
    status: DecisionStatus;
    decidedById?: string | null;
    decidedByName?: string;
    channelId?: string | null;
    channelName?: string;
    messageId?: string | null;
    impactedAreas: string[];
    workplaceId: string;
    createdAt: string;
    updatedAt: string;
}
export interface AiCorrection {
    id: string;
    workplaceId: string;
    userId: string;
    userName?: string;
    agentId?: string;
    category: 'tone' | 'action_items' | 'decisions' | 'routing' | 'general';
    originalText: string;
    correctedText: string;
    instruction?: string;
    createdAt: string;
}
export interface AiLearningRule {
    id: string;
    workplaceId: string;
    rule: string;
    category: string;
    active: boolean;
    confidence: number;
    createdAt: string;
}
