/**
 * CodeForge IDE — Standalone AI Agent Types
 * All TypeScript interfaces and types for the agent system.
 */

// ─── Provider Types ───────────────────────────────────────────

export type ProviderId = 'openai' | 'google' | 'groq' | 'anthropic';

export interface AgentModel {
  id: string;
  name: string;
  contextWindow: number;
  supportsToolCalling: boolean;
  supportsStreaming: boolean;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  models: AgentModel[];
  apiKeyPlaceholder: string;
  apiKeyUrl: string;
}

export interface AgentConfig {
  provider: ProviderId;
  apiKey: string;
  model: string;
  systemPrompt?: string;
  temperature: number;
  maxTokens: number;
  language: 'ar' | 'en';
  /** GitHub Personal Access Token for repo operations */
  githubToken?: string;
}

// ─── Tool Types ───────────────────────────────────────────────

export type RiskLevel = 'auto' | 'notify' | 'confirm';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  riskLevel: RiskLevel;
  category: 'filesystem' | 'git' | 'github' | 'utility';
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  /** Optional extended fields (used in UI) */
  toolName?: string;
  args?: Record<string, unknown>;
  status?: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  result?: ToolCallResult;
  createdAt?: number;
}

export interface ToolCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
  diff?: FileDiff;
}

// ─── Message Types ────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  createdAt: number;
}

// ─── Approval Types ───────────────────────────────────────────

export interface PendingApproval {
  id: string;
  toolCall: ToolCall;
  toolName: string;
  description: string;
  riskLevel: RiskLevel;
  affectedFiles?: string[];
  diff?: FileDiff;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface FileDiff {
  filePath: string;
  oldContent: string;
  newContent: string;
  type: 'create' | 'modify' | 'delete' | 'rename' | 'move';
}

// ─── Session Types ────────────────────────────────────────────

export interface AgentSession {
  id: string;
  messages: AgentMessage[];
  config: AgentConfig;
  createdAt: number;
  updatedAt: number;
}

// ─── API Types ────────────────────────────────────────────────

export interface AgentRequest {
  messages: AgentMessage[];
  config: AgentConfig;
  tools: ToolDefinition[];
  projectContext?: ProjectContext;
}

export interface ProjectContext {
  projectName: string;
  mainLanguage: string;
  fileTree: string;
  repoUrl?: string;
  currentBranch?: string;
}

// ─── Audit Types ──────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: ToolCallResult;
  riskLevel?: RiskLevel;
  approved?: boolean;
  approvedBy?: 'auto' | 'user';
  timestamp: number;
}
